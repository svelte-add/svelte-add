import { OptionValues as CliOptionValues, program } from "commander";
import { booleanPrompt, endPrompts, startPrompts, textPrompt } from "../utils/prompts.js";
import { Workspace, WorkspaceWithoutExplicitArgs, addPropertyToWorkspaceOption } from "../utils/workspace.js";
import { AdderConfig, AdderConfigWithoutExplicitArgs } from "./config.js";

export type BooleanDefaultValue = {
    type: "boolean";
    default: boolean;
};

export type StringDefaultValue = {
    type: "string";
    default: string;
};

export type NumberDefaultValue = {
    type: "number";
    default: number;
};

export type BaseQuestion = {
    question: string;
};

export type BooleanQuestion = BaseQuestion & BooleanDefaultValue;
export type StringQuestion = BaseQuestion & StringDefaultValue;
export type NumberQuestion = BaseQuestion & NumberDefaultValue;
export type Question = BooleanQuestion | StringQuestion | NumberQuestion;

export type OptionDefinition = Record<string, Question>;
export type OptionValues<Args extends OptionDefinition> = {
    [K in keyof Args]: Args[K]["type"] extends "string"
        ? string
        : Args[K]["type"] extends "boolean"
          ? boolean
          : Args[K]["type"] extends "number"
            ? number
            : never;
};

export function prepareAndParseCliOptions(config: AdderConfigWithoutExplicitArgs) {
    program.option("--path <string>", "Path to working directory");

    if (config.options) {
        for (const optionKey of Object.keys(config.options)) {
            const option = config.options[optionKey];

            program.option(`--${optionKey} [value]`, option.question);
        }
    }

    program.parse();
    const options = program.opts();
    return options;
}

export async function askQuestionsAndAssignValuesToWorkspace(
    config: AdderConfigWithoutExplicitArgs,
    workspace: WorkspaceWithoutExplicitArgs,
    cliOptions: CliOptionValues,
) {
    if (!config.options) return;

    let needsToAskQuestions = false;
    for (const optionKey of Object.keys(config.options)) {
        const cliOption = cliOptions[optionKey];
        if (cliOption === undefined) {
            needsToAskQuestions = true;
        }
    }

    if (needsToAskQuestions) {
        startPrompts(`${config.metadata.package}@${config.metadata.version}`);
    }

    for (const optionKey of Object.keys(config.options)) {
        const cliOption = cliOptions[optionKey];
        if (cliOption !== undefined) {
            addPropertyToWorkspaceOption(workspace, optionKey, cliOption);

            continue;
        }

        const option = config.options[optionKey];
        let optionValue;

        if (option.type == "number" || option.type == "string") {
            optionValue = await textPrompt(option.question, "Not sure", "" + option.default);
        } else if (option.type == "boolean") {
            optionValue = await booleanPrompt(option.question, option.default);
        }

        addPropertyToWorkspaceOption(workspace, optionKey, optionValue);
    }

    if (needsToAskQuestions) {
        endPrompts(`You're all set!`);
    }
}

export function ensureCorrectOptionTypes(config: AdderConfigWithoutExplicitArgs, workspace: WorkspaceWithoutExplicitArgs) {
    if (!config.options) {
        return;
    }

    let foundInvalidType = false;

    for (const optionKey of Object.keys(config.options)) {
        const option = config.options[optionKey];
        const value = workspace.options[optionKey];

        if (option.type == "boolean" && typeof value == "boolean") {
            continue;
        } else if (option.type == "number" && typeof value == "number") {
            continue;
        } else if (
            option.type == "number" &&
            typeof value == "string" &&
            typeof parseInt(value) == "number" &&
            !isNaN(parseInt(value))
        ) {
            addPropertyToWorkspaceOption(workspace, optionKey, parseInt(value));
            continue;
        } else if (option.type == "string" && typeof value == "string") {
            continue;
        }

        foundInvalidType = true;
        console.log(`Option ${optionKey} needs to be of type ${option.type} but was of type ${typeof value}!`);
    }

    if (foundInvalidType) {
        console.log("Found invalid option type. Exiting.");
        process.exit(0);
    }
}
