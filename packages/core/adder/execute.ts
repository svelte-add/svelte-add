import path from "path";
import { commonFilePaths, format, writeFile } from "../files/utils.js";
import { createProject, detectSvelteDirectory } from "../utils/create-project.js";
import { createOrUpdateFiles } from "../files/processors.js";
import { executeCli, getPackageJson, groupBy } from "../utils/common.js";
import {
    type Workspace,
    createEmptyWorkspace,
    populateWorkspaceDetails,
    addPropertyToWorkspaceOption,
} from "../utils/workspace.js";
import {
    type OptionDefinition,
    ensureCorrectOptionTypes as validateOptionTypes,
    prepareAndParseCliOptions,
    extractCommonCliOptions,
    extractAdderCliOptions,
    AvailableCliOptionValues,
    requestMissingOptionsFromUser,
} from "./options.js";
import type { AdderCheckConfig, AdderConfig, ExternalAdderConfig, InlineAdderConfig } from "./config.js";
import type { RemoteControlOptions } from "./remoteControl.js";
import { suggestInstallingDependencies } from "../utils/dependencies.js";
import { serializeJson } from "@svelte-add/ast-tooling";
import { validatePreconditions } from "./preconditions.js";
import { PromptOption, endPrompts, multiSelectPrompt, startPrompts } from "../utils/prompts.js";
import { categories } from "./categories.js";

export type AdderDetails<Args extends OptionDefinition> = {
    config: AdderConfig<Args>;
    checks: AdderCheckConfig<Args>;
};

export type ExecutingAdderInfo = {
    name: string;
    version: string;
};

export type AddersExecutionPlan = {
    createProject: boolean;
    commonCliOptions: AvailableCliOptionValues;
    cliOptionsByAdderId: Record<string, Record<string, unknown>>;
    workingDirectory: string;
};

export async function executeAdder<Args extends OptionDefinition>(
    adderDetails: AdderDetails<Args>,
    remoteControlOptions: RemoteControlOptions | undefined = undefined,
) {
    const adderMetadata = adderDetails.config.metadata;
    const executingAdderInfo: ExecutingAdderInfo = {
        name: adderMetadata.package,
        version: adderMetadata.version,
    };
    await executeAdders([adderDetails], executingAdderInfo, remoteControlOptions);
}

export async function executeAdders<Args extends OptionDefinition>(
    adderDetails: AdderDetails<Args>[],
    executingAdder: ExecutingAdderInfo,
    remoteControlOptions: RemoteControlOptions | undefined = undefined,
) {
    const adderDetailsByAdderId: Map<string, AdderDetails<Args>> = new Map();
    adderDetails.map((x) => adderDetailsByAdderId.set(x.config.metadata.id, x));

    const remoteControlled = remoteControlOptions !== undefined;
    const isTesting = remoteControlled && remoteControlOptions.isTesting;

    const cliOptions = !isTesting ? prepareAndParseCliOptions(adderDetails) : {};
    const commonCliOptions = extractCommonCliOptions(cliOptions);
    const cliOptionsByAdderId = !isTesting ? extractAdderCliOptions(cliOptions, adderDetails) : remoteControlOptions.adderOptions;
    validateOptionTypes(adderDetails, cliOptionsByAdderId);

    let workingDirectory: string | null;
    if (isTesting) workingDirectory = remoteControlOptions.workingDirectory;
    else workingDirectory = determineWorkingDirectory(commonCliOptions.path);
    workingDirectory = await detectSvelteDirectory(workingDirectory);
    const createProject = workingDirectory == null;
    if (!workingDirectory) workingDirectory = process.cwd();

    const executionPlan: AddersExecutionPlan = {
        workingDirectory,
        createProject,
        commonCliOptions,
        cliOptionsByAdderId,
    };

    await executePlan(executionPlan, executingAdder, adderDetails, remoteControlOptions);
}

async function executePlan<Args extends OptionDefinition>(
    executionPlan: AddersExecutionPlan,
    executingAdder: ExecutingAdderInfo,
    adderDetails: AdderDetails<Args>[],
    remoteControlOptions: RemoteControlOptions | undefined,
) {
    const remoteControlled = remoteControlOptions !== undefined;
    const isTesting = remoteControlled && remoteControlOptions.isTesting;

    if (!isTesting) startPrompts(`Welcome to ${executingAdder.name}@${executingAdder.version}`);

    // create project if required
    if (executionPlan.createProject) {
        const cwd = executionPlan.commonCliOptions.path ?? executionPlan.workingDirectory;
        const { projectCreated, directory } = await createProject(cwd);
        if (!projectCreated) return;
        executionPlan.workingDirectory = directory;
    }

    // select appropriate adders
    let userSelectedAdders = executionPlan.commonCliOptions.adders ?? [];
    if (userSelectedAdders.length == 0 && adderDetails.length > 1) {
        // if the user has not selected any adders via the cli and we are currently executing for more than one adder
        // the user should have the possibility to select the adders he want's to add.
        userSelectedAdders = await askForAddersToApply(adderDetails);
    } else if (userSelectedAdders.length == 0 && adderDetails.length == 1) {
        // if we are executing only one adder, then we can safely assume that this adder should be added
        userSelectedAdders = [adderDetails[0].config.metadata.id];
    }

    // remove unselected adder data
    const addersToRemove = adderDetails.filter((x) => !userSelectedAdders.includes(x.config.metadata.id));
    for (const adderToRemove of addersToRemove) {
        const adderId = adderToRemove.config.metadata.id;
        delete executionPlan.cliOptionsByAdderId[adderId];
    }
    adderDetails = adderDetails.filter((x) => userSelectedAdders.includes(x.config.metadata.id));

    // preconditions
    if (!executionPlan.commonCliOptions.skipPreconditions)
        await validatePreconditions(adderDetails, executingAdder.name, executionPlan.workingDirectory, isTesting);

    // applies the default option value to missing adder's cli options
    if (executionPlan.commonCliOptions.default) {
        for (const adder of adderDetails) {
            const adderId = adder.config.metadata.id;
            for (const [option, value] of Object.entries(adder.config.options)) {
                executionPlan.cliOptionsByAdderId[adderId][option] ??= value.default;
            }
        }
    }

    // ask the user questions about unselected options
    await requestMissingOptionsFromUser(adderDetails, executionPlan);

    // apply the adders
    for (const { config } of adderDetails) {
        const adderId = config.metadata.id;

        const workspace = createEmptyWorkspace();
        await populateWorkspaceDetails(workspace, executionPlan.workingDirectory);
        if (executionPlan.cliOptionsByAdderId) {
            for (const [key, value] of Object.entries(executionPlan.cliOptionsByAdderId[adderId])) {
                addPropertyToWorkspaceOption(workspace, key, value);
            }
        }

        const isInstall = true;
        if (config.integrationType === "inline") {
            const localConfig = config as InlineAdderConfig<OptionDefinition>;
            await processInlineAdder(localConfig, workspace, isInstall);
        } else if (config.integrationType === "external") {
            await processExternalAdder(config, executionPlan.workingDirectory, isTesting);
        } else {
            throw new Error(`Unknown integration type`);
        }
    }

    if (!remoteControlled && !executionPlan.commonCliOptions.skipInstall)
        await suggestInstallingDependencies(executionPlan.workingDirectory);

    if (!isTesting) endPrompts("You're all set!");
}

async function askForAddersToApply<Args extends OptionDefinition>(adderDetails: AdderDetails<Args>[]): Promise<string[]> {
    const groupedByCategory = groupBy(adderDetails, (x) => x.config.metadata.category.id);
    const selectedAdders: string[] = [];
    const totalCategories = Object.keys(categories).length;
    let currentCategory = 0;

    for (const [categoryId, adders] of groupedByCategory) {
        currentCategory++;
        const categoryDetails = categories[categoryId];

        const promptOptions: PromptOption<string>[] = [];
        for (const adder of adders) {
            const adderMetadata = adder.config.metadata;
            promptOptions.push({
                label: adderMetadata.name,
                value: adderMetadata.id,
                hint: adderMetadata.description,
            });
        }

        const promptDescription = `${categoryDetails.name} (${currentCategory} / ${totalCategories})`;
        const selectedValues = await multiSelectPrompt(promptDescription, promptOptions);
        selectedAdders.push(...selectedValues);
    }

    return selectedAdders;
}

async function processInlineAdder<Args extends OptionDefinition>(
    config: InlineAdderConfig<Args>,
    workspace: Workspace<Args>,
    isInstall: boolean,
) {
    await installPackages(config, workspace);
    await createOrUpdateFiles(config.files, workspace);
    await runHooks(config, workspace, isInstall);
}

async function processExternalAdder<Args extends OptionDefinition>(
    config: ExternalAdderConfig<Args>,
    workingDirectory: string,
    isTesting: boolean,
) {
    if (!isTesting) console.log("Executing external command");

    if (!config.environment) config.environment = {};

    try {
        await executeCli("npx", config.command.split(" "), workingDirectory, {
            env: Object.assign(process.env, config.environment),
            stdio: isTesting ? "pipe" : "inherit",
        });
    } catch (error) {
        throw new Error("Failed executing external command: " + error);
    }
}

export function determineWorkingDirectory(directory: string | undefined) {
    let cwd = directory ?? process.cwd();
    if (!path.isAbsolute(cwd)) {
        cwd = path.join(process.cwd(), cwd);
    }

    return cwd;
}

export async function installPackages<Args extends OptionDefinition>(
    config: InlineAdderConfig<Args>,
    workspace: Workspace<Args>,
) {
    const { text: originalText, data } = await getPackageJson(workspace);

    for (const dependency of config.packages) {
        if (dependency.condition && !dependency.condition(workspace)) {
            continue;
        }

        if (dependency.dev) {
            if (!data.devDependencies) {
                data.devDependencies = {};
            }

            data.devDependencies[dependency.name] = dependency.version;
        } else {
            if (!data.dependencies) {
                data.dependencies = {};
            }

            data.dependencies[dependency.name] = dependency.version;
        }
    }

    const packageText = await format(workspace, commonFilePaths.packageJsonFilePath, serializeJson(originalText, data));
    await writeFile(workspace, commonFilePaths.packageJsonFilePath, packageText);
}

async function runHooks<Args extends OptionDefinition>(
    config: InlineAdderConfig<Args>,
    workspace: Workspace<Args>,
    isInstall: boolean,
) {
    if (isInstall && config.installHook) await config.installHook(workspace);
    else if (!isInstall && config.uninstallHook) await config.uninstallHook(workspace);
}

export function generateAdderInfo(pkg: any): {
    id: string;
    package: string;
    version: string;
} {
    const name = pkg.name;
    const id = name.replace("@svelte-add/", "");

    return {
        id,
        package: name,
        version: pkg.version,
    };
}
