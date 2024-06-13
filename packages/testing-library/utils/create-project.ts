import { mkdir, rm } from "fs/promises";
import { create } from "create-svelte";
import { join } from "path";
import { executeCli } from "@svelte-add/core";

export const ProjectTypes = {
    Svelte_JS: "svelte-js",
    Svelte_TS: "svelte-ts",
    Kit_JS: "kit-js",
    Kit_JS_Comments: "kit-js-comments",
    Kit_TS: "kit-ts",
};
export const ProjectTypesList = Object.values(ProjectTypes);

export async function createProject(output: string, projectType: string) {
    await rm(output, { recursive: true, force: true });

    if (projectType.includes("kit")) {
        await create(output, {
            name: "test",
            eslint: false,
            playwright: false,
            prettier: false,
            template: "skeleton",
            types:
                projectType == ProjectTypes.Kit_JS_Comments
                    ? "checkjs"
                    : projectType == ProjectTypes.Kit_TS
                      ? "typescript"
                      : null,
            vitest: false,
        });
    } else {
        const template = projectType == ProjectTypes.Svelte_TS ? "svelte-ts" : "svelte";
        let args = ["create", "vite@latest", projectType, "--yes", "--template", template];

        try {
            await executeCli("pnpm", args, join(output, ".."));
        } catch (error) {
            throw new Error("Failed initializing vite project: " + error);
        }
    }
}

export async function downloadProjectTemplates(output: string) {
    for (const template of ProjectTypesList) {
        const directory = join(output, template);
        await mkdir(directory, { recursive: true });
        await createProject(directory, template);
    }
}
