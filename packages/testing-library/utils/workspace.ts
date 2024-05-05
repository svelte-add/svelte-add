import { spawn } from "child_process";
import { cp, mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { TestOptions } from "..";

const templatesDirectory = "templates";

export function getTemplatesDirectory(options: TestOptions) {
    return join(options.outputDirectory, templatesDirectory);
}

export async function installDependencies(output: string): Promise<void> {
    const program = await spawn("npm", ["install"], { stdio: "pipe", shell: true, cwd: output });

    return await new Promise((resolve) => {
        program.on("exit", (code) => {
            if (code == 0) {
                resolve();
            } else {
                throw new Error("unable to install dependencies");
            }
        });
    });
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
