import path from "path";
import { commonFilePaths, format, writeFile } from "../files/utils.js";
import { detectOrCreateProject } from "../utils/create-project.js";
import { createOrUpdateFiles } from "../files/processors.js";
import { getPackageJson } from "../utils/common.js";
import { Workspace, WorkspaceWithoutExplicitArgs, createEmptyWorkspace, populateWorkspaceDetails } from "../utils/workspace.js";
import {
    OptionDefinition,
    askQuestionsAndAssignValuesToWorkspace,
    ensureCorrectOptionTypes,
    prepareAndParseCliOptions,
} from "./options.js";
import {
    AdderCheckConfig,
    AdderConfig,
    ExternalAdderConfig,
    InlineAdderConfig,
    PostInstallationCheck,
    PreInstallationCheck,
} from "./config.js";
import { OptionValues } from "commander";
import { RemoteControlOptions } from "./remoteControl.js";
import { suggestInstallingDependencies } from "../utils/dependencies.js";
import { spawnSync } from "child_process";
import { serializeJson } from "@svelte-add/ast-tooling";

export async function executeAdder<Args extends OptionDefinition>(
    config: AdderConfig<Args>,
    checks: AdderCheckConfig<Args>,
    remoteControlOptions: RemoteControlOptions = undefined,
) {
    if (checks.preInstallation) {
        await runPreInstallationChecks(checks.preInstallation);
    }

    const remoteControlled = remoteControlOptions !== undefined;
    const isTesting = remoteControlled && remoteControlOptions.isTesting;

    let cliOptions = {};
    let workingDirectory = "";
    if (!remoteControlled) {
        cliOptions = prepareAndParseCliOptions(config);
        workingDirectory = determineWorkingDirectory(cliOptions);
        workingDirectory = await detectOrCreateProject(workingDirectory);
    } else {
        cliOptions = remoteControlOptions.optionValues;
        workingDirectory = remoteControlOptions.workingDirectory;
    }

    const workspace = createEmptyWorkspace();
    await populateWorkspaceDetails(workspace, workingDirectory);

    await askQuestionsAndAssignValuesToWorkspace(config, workspace, cliOptions);
    ensureCorrectOptionTypes(config, workspace);

    const isInstall = true;

    if (config.integrationType == "inline") {
        await processInlineAdder<Args>(config, workspace, isInstall, remoteControlled, workingDirectory);
    } else if (config.integrationType == "external") {
        await processExternalAdder<Args>(config, workingDirectory, isTesting);
    } else {
        throw new Error(`Unknown integration type`);
    }

    await runPostInstallationChecks(checks.postInstallation);
}

async function processInlineAdder<Args extends OptionDefinition>(
    config: InlineAdderConfig<Args>,
    workspace: WorkspaceWithoutExplicitArgs,
    isInstall: boolean,
    remoteControlled: boolean,
    workingDirectory: string,
) {
    await installPackages(config, workspace);
    await createOrUpdateFiles(config.files, workspace);
    await runHooks(config, workspace, isInstall);
    if (!remoteControlled) await suggestInstallingDependencies(workingDirectory);
}

async function processExternalAdder<Args extends OptionDefinition>(
    config: ExternalAdderConfig<Args>,
    workingDirectory: string,
    isTesting: boolean,
) {
    if (!isTesting) console.log("Executing external command");

    if (!config.environment) config.environment = {};

    spawnSync("npx", config.command.split(" "), {
        stdio: isTesting ? "ignore" : "inherit",
        shell: true,
        cwd: workingDirectory,
        env: Object.assign(process.env, config.environment),
    });
    if (!isTesting && config.installDependencies) await suggestInstallingDependencies(workingDirectory);
}

export function determineWorkingDirectory(options: OptionValues) {
    let cwd = options.path ?? process.cwd();
    if (!path.isAbsolute(cwd)) {
        cwd = path.join(process.cwd(), cwd);
    }

    return cwd;
}

export async function installPackages(config: InlineAdderConfig<OptionDefinition>, workspace: WorkspaceWithoutExplicitArgs) {
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

function runHooks<Args extends OptionDefinition>(
    config: InlineAdderConfig<Args>,
    workspace: Workspace<Args>,
    isInstall: boolean,
) {
    if (isInstall && config.installHook) config.installHook(workspace);
    else if (!isInstall && config.uninstallHook) config.uninstallHook(workspace);
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

export async function runPreInstallationChecks(checks: PreInstallationCheck[]) {
    // console.log(checks);
}

export async function runPostInstallationChecks(checks: PostInstallationCheck[]) {
    // console.log(checks);
}
