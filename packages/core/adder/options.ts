import { type OptionValues as CliOptionValues, program } from 'commander';
import { booleanPrompt, selectPrompt, textPrompt, type PromptOption } from '../utils/prompts.js';
import type { AdderDetails, AddersExecutionPlan } from './execute.js';

export type BooleanQuestion = {
	type: 'boolean';
	default: boolean;
};

export type StringQuestion = {
	type: 'string';
	default: string;
};

export type NumberQuestion = {
	type: 'number';
	default: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SelectQuestion<Value = any> = {
	type: 'select';
	default: Value;
	options: PromptOption<Value>[];
};

export type BaseQuestion = {
	question: string;
	// TODO: we want this to be akin to OptionValues<Args> so that the options can be inferred
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	condition?: (options: OptionValues<any>) => boolean;
};

export type Question = BaseQuestion &
	(BooleanQuestion | StringQuestion | NumberQuestion | SelectQuestion);

export type OptionDefinition = Record<string, Question>;
export type OptionValues<Args extends OptionDefinition> = {
	[K in keyof Args]: Args[K] extends StringQuestion
		? string
		: Args[K] extends BooleanQuestion
			? boolean
			: Args[K] extends NumberQuestion
				? number
				: Args[K] extends SelectQuestion<infer Value>
					? Value
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
} & (BooleanQuestion | StringQuestion);
export type AvailableCliOptions = Record<AvailableCliOptionKeys, AvailableCliOption>;

export const availableCliOptions: AvailableCliOptions = {
	default: {
		cliArg: 'default',
		processedCliArg: 'default',
		type: 'boolean',
		default: false,
		description: 'Installs default adder options for unspecified options',
		allowShorthand: true,
	},
	path: {
		cliArg: 'path',
		processedCliArg: 'path',
		type: 'string',
		default: './',
		description: 'Path to working directory',
		allowShorthand: false,
	},
	skipPreconditions: {
		cliArg: 'skip-preconditions',
		processedCliArg: 'skipPreconditions',
		type: 'boolean',
		default: false,
		description: 'Skips validating preconditions before running the adder',
		allowShorthand: true,
	},
	skipInstall: {
		cliArg: 'skip-install',
		processedCliArg: 'skipInstall',
		type: 'boolean',
		default: false,
		description: 'Skips installing dependencies after applying the adder',
		allowShorthand: true,
	},
};

export function prepareAndParseCliOptions<Args extends OptionDefinition>(
	adderDetails: AdderDetails<Args>[],
) {
	const multipleAdders = adderDetails.length > 1;

	for (const option of Object.values(availableCliOptions)) {
		if (option.allowShorthand) {
			program.option(`--${option.cliArg} [${option.type}]`, option.description);
		} else {
			program.option(`--${option.cliArg} <${option.type}>`, option.description);
		}
	}

	if (multipleAdders) {
		program.argument('[adders...]', 'List of adders to install');
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

	if (multipleAdders) {
		let selectedAdderIds = program.args ?? [];

		// replace aliases with adder ids
		selectedAdderIds = selectedAdderIds.map((id) => {
			const adder = adderDetails.find(({ config }) => config.metadata?.alias === id);
			return adder ? adder.config.metadata.id : id;
		});

		validateAdders(adderDetails, selectedAdderIds);

		options.adder = selectedAdderIds;
	}

	return options;
}

function validateAdders<Args extends OptionDefinition>(
	adderDetails: AdderDetails<Args>[],
	selectedAdderIds: string[],
) {
	const validAdderIds = adderDetails.map((x) => x.config.metadata.id);
	const invalidAdders = selectedAdderIds.filter((x) => !validAdderIds.includes(x));

	if (invalidAdders.length > 0) {
		console.error(
			`Invalid adder${invalidAdders.length > 1 ? 's' : ''} selected:`,
			invalidAdders.join(', '),
		);
		process.exit(1);
	}
}

export function ensureCorrectOptionTypes<Args extends OptionDefinition>(
	adderDetails: AdderDetails<Args>[],
	cliOptionsByAdderId: Record<string, Record<string, unknown>>,
) {
	let foundInvalidType = false;

	for (const { config } of adderDetails) {
		const adderId = config.metadata.id;

		for (const optionKey of Object.keys(config.options)) {
			const option = config.options[optionKey];
			const value = cliOptionsByAdderId[adderId][optionKey];

			if (value == undefined) {
				continue;
			} else if (option.type == 'boolean' && typeof value == 'boolean') {
				continue;
			} else if (option.type == 'number' && typeof value == 'number') {
				continue;
			} else if (
				option.type == 'number' &&
				typeof value == 'string' &&
				typeof parseInt(value) == 'number' &&
				!isNaN(parseInt(value))
			) {
				cliOptionsByAdderId[adderId][optionKey] = parseInt(value);
				continue;
			} else if (option.type == 'string' && typeof value == 'string') {
				continue;
			} else if (option.type === 'select') {
				continue;
			}

			foundInvalidType = true;
			console.log(
				`Option ${optionKey} needs to be of type ${option.type} but was of type ${typeof value}!`,
			);
		}
	}

	if (foundInvalidType) {
		console.log('Found invalid option type. Exiting.');
		process.exit(0);
	}
}

export function extractCommonCliOptions(cliOptions: CliOptionValues) {
	const typedOption = <T>(name: string) => cliOptions[name] as T;

	const commonOptions: AvailableCliOptionValues = {
		default: typedOption(availableCliOptions.default.processedCliArg),
		path: typedOption(availableCliOptions.path.processedCliArg),
		skipInstall: typedOption(availableCliOptions.skipInstall.processedCliArg),
		skipPreconditions: typedOption(availableCliOptions.skipPreconditions.processedCliArg),
		adders: typedOption('adder'),
	};

	return commonOptions;
}

export function extractAdderCliOptions<Args extends OptionDefinition>(
	cliOptions: CliOptionValues,
	adderDetails: AdderDetails<Args>[],
) {
	const multipleAdders = adderDetails.length > 1;

	const options: Record<string, Record<string, unknown>> = {};
	for (const { config } of adderDetails) {
		const adderId = config.metadata.id;
		options[adderId] = {};

		for (const optionKey of Object.keys(config.options)) {
			let cliOptionKey = optionKey;

			if (multipleAdders) cliOptionKey = `${adderId}${upperCaseFirstLetter(cliOptionKey)}`;

			let optionValue = cliOptions[cliOptionKey] as unknown;
			if (optionValue === 'true') optionValue = true;
			else if (optionValue === 'false') optionValue = false;

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
	for (const { config } of adderDetails) {
		const adderId = config.metadata.id;
		const questionPrefix = adderDetails.length > 1 ? `${config.metadata.name}: ` : '';

		for (const optionKey of Object.keys(config.options)) {
			const option = config.options[optionKey];
			const selectedValues = executionPlan.cliOptionsByAdderId[adderId];
			const skipQuestion = option.condition?.(selectedValues) === false;

			if (!selectedValues || skipQuestion) continue;

			let optionValue = selectedValues[optionKey];

			// if the option already has an value, ignore it and continue
			if (optionValue !== undefined) continue;

			if (option.type == 'number' || option.type == 'string') {
				optionValue = await textPrompt(
					questionPrefix + option.question,
					'Not sure',
					option.default.toString(),
				);
			} else if (option.type == 'boolean') {
				optionValue = await booleanPrompt(questionPrefix + option.question, option.default);
			} else if (option.type == 'select') {
				optionValue = await selectPrompt(
					questionPrefix + option.question,
					option.default,
					option.options,
				);
			}

			if (optionValue === 'true') optionValue = true;
			if (optionValue === 'false') optionValue = false;

			selectedValues[optionKey] = optionValue;
		}
	}
}
