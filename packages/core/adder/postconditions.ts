import { Workspace } from "../utils/workspace";
import { AdderCheckConfig, AdderConfig } from "./config";
import { OptionDefinition } from "./options";
import { fileExistsWorkspace, readFile } from "../files/utils";
import pc from "picocolors";
import { messagePrompt } from "../utils/prompts";

export type PreconditionParameters<Args extends OptionDefinition> = {
    workspace: Workspace<Args>;
    fileExists: (path: string) => Promise<void>;
    fileContains: (path: string, expectedContent: string) => Promise<void>;
};
export type Postcondition<Args extends OptionDefinition> = {
    name: string;
    run: (params: PreconditionParameters<Args>) => Promise<void>;
};

export async function checkPostconditions<Args extends OptionDefinition>(
    config: AdderConfig<Args>,
    checks: AdderCheckConfig<Args>,
    workspace: Workspace<Args>,
    multipleAdders: boolean,
) {
    const postconditions = checks.postconditions ?? [];
    const unmetPostconditions: string[] = [];

    for (const postcondition of postconditions) {
        try {
            await postcondition.run({
                workspace,
                fileExists: (path) => fileExists(path, workspace),
                fileContains: (path, expectedContent) => fileContains(path, workspace, expectedContent),
            });
        } catch (error) {
            const typedError = error as Error;
            const message = `${postcondition.name} (${typedError.message})`;
            unmetPostconditions.push(`${multipleAdders ? config.metadata.id + ": " : ""}${message}`);
        }
    }

    return unmetPostconditions;
}

async function fileExists<Args extends OptionDefinition>(path: string, workspace: Workspace<Args>) {
    if (await fileExistsWorkspace(workspace, path)) return;

    throw new Error(`File "${path}" does not exists`);
}

async function fileContains<Args extends OptionDefinition>(
    path: string,
    workspace: Workspace<Args>,
    expectedContent: string,
): Promise<void> {
    await fileExists(path, workspace);

    const content = await readFile(workspace, path);
    if (content && content.includes(expectedContent)) return;

    throw new Error(`File "${path}" does not contain "${expectedContent}"`);
}

export async function printUnmetPostconditions(unmetPostconditions: string[]) {
    const postconditionList = unmetPostconditions.map((x) => pc.yellow(`- ${x}`)).join("\n");
    const additionalText = `Postconditions are not supposed to fail.
Please open an issue providing the full console output:
https://github.com/svelte-add/svelte-add/issues/new/choose`;
    messagePrompt("Postconditions not met", `${postconditionList}\n\n${additionalText}`);
}
