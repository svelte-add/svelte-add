import { cp, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { TestOptions } from "..";
import { executeCli } from "@svelte-add/core";

const templatesDirectory = "templates";

export function getTemplatesDirectory(options: TestOptions) {
    return join(options.outputDirectory, templatesDirectory);
}

export async function installDependencies(output: string) {
    try {
        await executeCli("pnpm", ["install", "--ignore-workspace"], output, { stdio: "pipe" });
    } catch (error) {
        throw new Error("unable to install dependencies: " + error);
    }
}

export async function prepareWorkspaceWithTemplate(output: string, template: string, templatesOutputDirectory: string) {
    const templateDirectory = join(templatesOutputDirectory, template);
    await mkdir(output, { recursive: true });
    await cp(templateDirectory, output, { recursive: true });

    return output;
}

export async function saveOptionsFile(workingDirectory: string, options: Record<string, any>) {
    const json = JSON.stringify(options);
    await writeFile(join(workingDirectory, "options.json"), json);
}
