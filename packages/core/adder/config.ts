import { CssAstEditor, HtmlAstEditor, JsAstEditor, SvelteAstEditor } from "@svelte-add/ast-manipulation";
import { executeAdder } from "./execute.js";
import * as remoteControl from "./remoteControl.js";
import { CategoryInfo } from "./categories.js";
import { OptionDefinition, OptionValues, Question } from "./options.js";
import { FileTypes } from "../files/processors.js";
import { Workspace } from "../utils/workspace.js";

export { CssAstEditor, HtmlAstEditor, JsAstEditor, SvelteAstEditor };

export type ConditionDefinition<Args extends OptionDefinition> = (Workspace: Workspace<Args>) => boolean;
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
    package: string;
    version: string;
    name: string;
    description: string;
    category: CategoryInfo;
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
    integrationType: string;
};

export type InlineAdderConfig<Args extends OptionDefinition> = BaseAdderConfig<Args> & {
    integrationType: "inline";
    packages: PackageDefinition<Args>[];
    files: FileTypes<Args>[];
    installHook?: (workspace: Workspace<Args>) => Promise<void>;
    uninstallHook?: (workspace: Workspace<Args>) => Promise<void>;
};

export type ExternalAdderConfig<Args extends OptionDefinition> = BaseAdderConfig<Args> & {
    integrationType: "external";
    command: string;
    environment?: Record<string, string>;
};

export type AdderConfig<Args extends OptionDefinition> = InlineAdderConfig<Args> | ExternalAdderConfig<Args>;

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
    const remoteControlled = remoteControl.isRemoteControlled();
    if (!remoteControlled) {
        executeAdder({
            config,
            checks,
        });
    }

    const adder: Adder<Args> = { config, checks, tests };
    return adder;
}

export type Tests = {
    expectProperty: (selector: string, property: string, expectedValue: string) => Promise<void>;
    elementExists: (selector: string) => Promise<void>;
    click: (selector: string, path?: string) => Promise<void>;
    expectUrlPath: (path: string) => Promise<void>;
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

export function defineAdderOptions<Args extends OptionDefinition>(options: Args) {
    return options;
}

export type Precondition = {
    name: string;
    run: () => Promise<{ success: boolean; message: string | undefined }>;
};

export type AdderCheckConfig<Args extends OptionDefinition> = {
    options: Args;
    preconditions?: Precondition[];
};

export function defineAdderChecks<Args extends OptionDefinition>(checks: AdderCheckConfig<Args>) {
    return checks;
}
