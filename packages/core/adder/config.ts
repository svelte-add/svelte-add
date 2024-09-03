import type {
	CssAstEditor,
	HtmlAstEditor,
	JsAstEditor,
	SvelteAstEditor,
} from '@svelte-add/ast-manipulation';
import type { OptionDefinition, OptionValues, Question } from './options.js';
import type { FileTypes } from '../files/processors.js';
import type { Workspace } from '../utils/workspace.js';
import type { Postcondition } from './postconditions.js';
import type { Colors } from 'picocolors/types.js';
import type { PackageManager } from '../utils/dependencies.js';

export type { CssAstEditor, HtmlAstEditor, JsAstEditor, SvelteAstEditor };

export type ConditionDefinition<Args extends OptionDefinition> = (
	Workspace: Workspace<Args>,
) => boolean;
export type ConditionDefinitionWithoutExplicitArgs = ConditionDefinition<Record<string, Question>>;

export type WebsiteMetadata = {
	logo: string;
	keywords: string[];
	documentation: string;
};

export type AdderConfigEnvironments = {
	svelte: boolean;
	kit: boolean;
};

export type AdderConfigMetadata = {
	id: string;
	alias?: string;
	name: string;
	description: string;
	environments: AdderConfigEnvironments;
	website?: WebsiteMetadata;
};

export type PackageDefinition<Args extends OptionDefinition> = {
	name: string;
	version: string;
	dev: boolean;
	condition?: ConditionDefinition<Args>;
};

export type BaseAdderConfig<Args extends OptionDefinition> = {
	metadata: AdderConfigMetadata;
	options: Args;
	runsAfter?: string[];
	integrationType: string;
};

export type InlineAdderConfig<Args extends OptionDefinition> = BaseAdderConfig<Args> & {
	integrationType: 'inline';
	packages: PackageDefinition<Args>[];
	files: FileTypes<Args>[];
	nextSteps?: (data: {
		options: OptionValues<Args>;
		cwd: string;
		colors: Colors;
		docs: string | undefined;
		packageManager: PackageManager;
	}) => string[];
	installHook?: (workspace: Workspace<Args>) => Promise<void>;
	uninstallHook?: (workspace: Workspace<Args>) => Promise<void>;
};

export type ExternalAdderConfig<Args extends OptionDefinition> = BaseAdderConfig<Args> & {
	integrationType: 'external';
	command: string;
	environment?: Record<string, string>;
};

export type AdderConfig<Args extends OptionDefinition> =
	| InlineAdderConfig<Args>
	| ExternalAdderConfig<Args>;

export function defineAdderConfig<Args extends OptionDefinition>(config: AdderConfig<Args>) {
	return config;
}

export type Adder<Args extends OptionDefinition> = {
	config: AdderConfig<Args>;
	checks: AdderCheckConfig<Args>;
	tests?: AdderTestConfig<Args>;
};

export type AdderWithoutExplicitArgs = Adder<Record<string, Question>>;
export type AdderConfigWithoutExplicitArgs = AdderConfig<Record<string, Question>>;

export function defineAdder<Args extends OptionDefinition>(
	config: AdderConfig<Args>,
	checks: AdderCheckConfig<Args>,
	tests?: AdderTestConfig<Args>,
) {
	const adder: Adder<Args> = { config, checks, tests };
	return adder;
}

export type Tests = {
	expectProperty: (selector: string, property: string, expectedValue: string) => Promise<void>;
	elementExists: (selector: string) => Promise<void>;
	click: (selector: string, path?: string) => Promise<void>;
	expectUrlPath: (path: string) => void;
};

export type TestDefinition<Args extends OptionDefinition> = {
	name: string;
	run: (tests: Tests) => Promise<void>;
	condition?: (options: OptionValues<Args>) => boolean;
};

export type AdderTestConfig<Args extends OptionDefinition> = {
	files: FileTypes<Args>[];
	options: Args;
	optionValues: OptionValues<Args>[];
	runSynchronously?: boolean;
	command?: string;
	tests: TestDefinition<Args>[];
};

export function defineAdderTests<Args extends OptionDefinition>(tests: AdderTestConfig<Args>) {
	return tests;
}

export function defineAdderOptions<const Args extends OptionDefinition>(options: Args) {
	return options;
}

type MaybePromise<T> = Promise<T> | T;

export type Precondition = {
	name: string;
	run: () => MaybePromise<{ success: boolean; message: string | undefined }>;
};

export type AdderCheckConfig<Args extends OptionDefinition> = {
	options: Args;
	preconditions?: Precondition[];
	postconditions?: Postcondition<Args>[];
};

export function defineAdderChecks<Args extends OptionDefinition>(checks: AdderCheckConfig<Args>) {
	return checks;
}
