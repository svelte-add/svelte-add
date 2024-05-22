import { type OptionValues as CliOptionValues, program } from "commander";
import { AdderDetails, AddersExecutionPlan } from "./execute.js";
import { textPrompt } from "../internal.js";
import { booleanPrompt } from "../utils/prompts.js";

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

export type CommonCliOptions = {
    path?: string;
    adders?: string[];
};

export function prepareAndParseCliOptions<Args extends OptionDefinition>(adderDetails: AdderDetails<Args>[]) {
    const multipleAdders = adderDetails.length > 1;

    program.option("--path <string>", "Path to working directory");
    if (multipleAdders) {
        program.option("--adder <string...>", "List of adders to install");
    }

    const addersWithOptions = adderDetails.filter((x) => Object.keys(x.config.options).length > 0);

    for (const { config } of addersWithOptions) {
        for (const optionKey of Object.keys(config.options)) {
            const option = config.options[optionKey];

            let optionString;
            if (multipleAdders) {
                optionString = `--${config.metadata.id}-${optionKey} [${option.type}]`;
            } else {
                optionString = `--${optionKey} [${option.type}]`;
            }

            program.option(optionString, option.question);
        }
    }

    program.parse();
    const options = program.opts();
    return options;
}

export function ensureCorrectOptionTypes<Args extends OptionDefinition>(
    adderDetails: AdderDetails<Args>[],
    cliOptionsByAdderId: Record<string, Record<string, any>>,
) {
    if (!cliOptionsByAdderId) {
        return;
    }

    let foundInvalidType = false;

    for (const { config } of adderDetails) {
        const adderId = config.metadata.id;

        for (const optionKey of Object.keys(config.options)) {
            const option = config.options[optionKey];
            const value = cliOptionsByAdderId[adderId][optionKey];

            if (value == undefined) {
                continue;
            } else if (option.type == "boolean" && typeof value == "boolean") {
                continue;
            } else if (option.type == "number" && typeof value == "number") {
                continue;
            } else if (
                option.type == "number" &&
                typeof value == "string" &&
                typeof parseInt(value) == "number" &&
                !isNaN(parseInt(value))
            ) {
                cliOptionsByAdderId[adderId][optionKey] = parseInt(value);
                continue;
            } else if (option.type == "string" && typeof value == "string") {
                continue;
            }

            foundInvalidType = true;
            console.log(`Option ${optionKey} needs to be of type ${option.type} but was of type ${typeof value}!`);
        }
    }

    if (foundInvalidType) {
        console.log("Found invalid option type. Exiting.");
        process.exit(0);
    }
}

export function extractCommonCliOptions(cliOptions: CliOptionValues) {
    const commonOptions: CommonCliOptions = {
        path: cliOptions.path,
        adders: cliOptions.adder,
    };

    return commonOptions;
}

export function extractAdderCliOptions<Args extends OptionDefinition>(
    cliOptions: CliOptionValues,
    adderDetails: AdderDetails<Args>[],
) {
    const multipleAdders = adderDetails.length > 1;

    const options: Record<string, Record<string, any>> = {};
    for (const { config } of adderDetails) {
        const adderId = config.metadata.id;
        options[adderId] = {};

        for (const optionKey of Object.keys(config.options)) {
            let cliOptionKey = optionKey;

            if (multipleAdders) cliOptionKey = `${adderId}${upperCaseFirstLetter(cliOptionKey)}`;

            let optionValue = cliOptions[cliOptionKey];
            if (optionValue === "true") optionValue = true;
            else if (optionValue === "false") optionValue = false;

            options[adderId][optionKey] = optionValue;
        }
    }

    return options;
}

function upperCaseFirstLetter(string: string) {
    return string.charAt(0).toLocaleUpperCase() + string.slice(1);
}

export async function requestMissingOptionsFromUser<Args extends OptionDefinition>(
    adderDetails: AdderDetails<Args>[],
    executionPlan: AddersExecutionPlan,
) {
    if (!executionPlan.cliOptionsByAdderId) return;

    for (const { config } of adderDetails) {
        const adderId = config.metadata.id;
        const questionPrefix = adderDetails.length > 1 ? `${config.metadata.name}: ` : "";

        for (const optionKey of Object.keys(config.options)) {
            const option = config.options[optionKey];

            if (!executionPlan.cliOptionsByAdderId[adderId]) continue;

            let optionValue = executionPlan.cliOptionsByAdderId[adderId][optionKey];

            // if the option already has an value, ignore it and continue
            if (optionValue) continue;

            if (option.type == "number" || option.type == "string") {
                optionValue = await textPrompt(questionPrefix + option.question, "Not sure", "" + option.default);
            } else if (option.type == "boolean") {
                optionValue = await booleanPrompt(questionPrefix + option.question, option.default);
            }

            if (optionValue === "true") optionValue = true;
            if (optionValue === "false") optionValue = false;

            executionPlan.cliOptionsByAdderId[adderId][optionKey] = optionValue;
        }
    }
}
