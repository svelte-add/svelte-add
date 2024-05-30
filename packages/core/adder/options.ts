import { type OptionValues as CliOptionValues, program } from "commander";
import { AdderDetails, AddersExecutionPlan } from "./execute.js";
import { booleanPrompt, selectPrompt, textPrompt, type PromptOption } from "../utils/prompts.js";

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

export type SelectDefaultValue<Value = any> = {
    type: "select";
    options: PromptOption<Value>[];
    default: Value;
};

export type BaseQuestion = {
    question: string;
};

export type BooleanQuestion = BaseQuestion & BooleanDefaultValue;
export type StringQuestion = BaseQuestion & StringDefaultValue;
export type NumberQuestion = BaseQuestion & NumberDefaultValue;
export type SelectQuestion = BaseQuestion & SelectDefaultValue;
export type Question = BooleanQuestion | StringQuestion | NumberQuestion | SelectQuestion;

export type OptionDefinition = Record<string, Question>;
export type OptionValues<Args extends OptionDefinition> = {
    [K in keyof Args]: Args[K]["type"] extends "string"
        ? string
        : Args[K]["type"] extends "boolean"
          ? boolean
          : Args[K]["type"] extends "number"
            ? number
            : Args[K]["type"] extends "select"
              ? // @ts-expect-error we're trying to infer the type of the select, but TS is being belligerent
                Args[K]["options"] extends Array<PromptOption<infer Value>>
                  ? Value
                  : never
              : never;
};

export type AvailableCliOptionKeys = keyof AvailableCliOptionKeyTypes;
export type AvailableCliOptionKeyTypes = {
    default: boolean;
    path: string;
    skipPreconditions: boolean;
    skipInstall: boolean;
};

export type AvailableCliOptionValues = {
    [K in AvailableCliOptionKeys]?: AvailableCliOptionKeyTypes[K];
} & { adders?: string[] };

export type AvailableCliOption = {
    cliArg: string;
    processedCliArg: string; // `commander` will transform the cli name if the arg names contains `-`
    description: string;
    allowShorthand: boolean;
} & (BooleanDefaultValue | StringDefaultValue);
export type AvailableCliOptions = Record<AvailableCliOptionKeys, AvailableCliOption>;

export const availableCliOptions: AvailableCliOptions = {
    default: {
        cliArg: "default",
        processedCliArg: "default",
        type: "boolean",
        default: false,
        description: "Installs default adder options for unspecified options",
        allowShorthand: true,
    },
    path: {
        cliArg: "path",
        processedCliArg: "path",
        type: "string",
        default: "./",
        description: "Path to working directory",
        allowShorthand: false,
    },
    skipPreconditions: {
        cliArg: "skip-preconditions",
        processedCliArg: "skipPreconditions",
        type: "boolean",
        default: false,
        description: "Skips validating preconditions before running the adder",
        allowShorthand: true,
    },
    skipInstall: {
        cliArg: "skip-install",
        processedCliArg: "skipInstall",
        type: "boolean",
        default: false,
        description: "Skips installing dependencies after applying the adder",
        allowShorthand: true,
    },
};

export function prepareAndParseCliOptions<Args extends OptionDefinition>(adderDetails: AdderDetails<Args>[]) {
    const multipleAdders = adderDetails.length > 1;

    for (const option of Object.values(availableCliOptions)) {
        if (option.allowShorthand) {
            program.option(`--${option.cliArg} [${option.type}]`, option.description);
        } else {
            program.option(`--${option.cliArg} <${option.type}>`, option.description);
        }
    }

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
    const commonOptions: AvailableCliOptionValues = {
        default: cliOptions[availableCliOptions.default.processedCliArg],
        path: cliOptions[availableCliOptions.path.processedCliArg],
        skipInstall: cliOptions[availableCliOptions.skipInstall.processedCliArg],
        skipPreconditions: cliOptions[availableCliOptions.skipPreconditions.processedCliArg],
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
            if (optionValue !== undefined) continue;

            if (option.type == "number" || option.type == "string") {
                optionValue = await textPrompt(questionPrefix + option.question, "Not sure", "" + option.default);
            } else if (option.type == "boolean") {
                optionValue = await booleanPrompt(questionPrefix + option.question, option.default);
            } else if (option.type == "select") {
                optionValue = await selectPrompt(questionPrefix + option.question, option.default, option.options);
            }

            if (optionValue === "true") optionValue = true;
            if (optionValue === "false") optionValue = false;

            executionPlan.cliOptionsByAdderId[adderId][optionKey] = optionValue;
        }
    }
}
