import { cp, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { TestOptions } from "..";
import { executeCli } from "@svelte-add/core";
import { OptionValues, Question } from "@svelte-add/core/adder/options";

const templatesDirectory = "templates";

export function getTemplatesDirectory(options: TestOptions) {
    return join(options.outputDirectory, templatesDirectory);
}

export async function installDependencies(output: string) {
    try {
        // Since tests are executed and installed within this repo (packages/tests/.outputs),
        // we need to add the `--ignore-workspace` flag so that our root lockfile isn't modified
        await executeCli("pnpm", ["install", "--ignore-workspace"], output, { stdio: "pipe" });
    } catch (error) {
        const typedError = error as Error;
        throw new Error("unable to install dependencies: " + typedError.message);
    }
}

export async function prepareWorkspaceWithTemplate(output: string, template: string, templatesOutputDirectory: string) {
    const templateDirectory = join(templatesOutputDirectory, template);
    await mkdir(output, { recursive: true });
    await cp(templateDirectory, output, { recursive: true });

    return output;
}

export async function saveOptionsFile(workingDirectory: string, options: OptionValues<Record<string, Question>>) {
    const json = JSON.stringify(options);
    await writeFile(join(workingDirectory, "options.json"), json);
}
