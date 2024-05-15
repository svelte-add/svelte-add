import fs from "fs/promises";
import path from "node:path";
import prettier from "prettier";
import type { WorkspaceWithoutExplicitArgs } from "../utils/workspace";

export async function readFile(workspace: WorkspaceWithoutExplicitArgs, filePath: string) {
    const fullFilePath = getFilePath(workspace.cwd, filePath);

    if (!(await fileExistsWorkspace(workspace, filePath))) {
        return "";
    }

    const buffer = await fs.readFile(fullFilePath);
    const text = buffer.toString();

    return text;
}

export async function writeFile(workspace: WorkspaceWithoutExplicitArgs, filePath: string, content: string) {
    const fullFilePath = getFilePath(workspace.cwd, filePath);
    const fullDirectoryPath = path.dirname(fullFilePath);

    if (!(await directoryExists(fullDirectoryPath))) {
        await fs.mkdir(fullDirectoryPath);
    }

    await fs.writeFile(fullFilePath, content);
}

export async function fileExistsWorkspace(workspace: WorkspaceWithoutExplicitArgs, filePath: string) {
    const fullFilePath = getFilePath(workspace.cwd, filePath);
    return await fileExists(fullFilePath);
}

export async function fileExists(filePath: string) {
    try {
        await fs.access(filePath, fs.constants.F_OK);
        return true;
    } catch (error) {
        return false;
    }
}

export async function directoryExists(directoryPath: string) {
    return await fileExists(directoryPath);
}

export function getFilePath(cwd: string, fileName: string) {
    return path.join(cwd, fileName);
}

export async function format(workspace: WorkspaceWithoutExplicitArgs, path: string, content: string) {
    const fullPath = getFilePath(workspace.cwd, path);
    return await formatFileWithPrettier(fullPath, content);
}

async function formatFileWithPrettier(path: string, content: string) {
    const options = await prettier.resolveConfig(path);

    try {
        return await prettier.format(content, {
            ...options,
            filepath: path,
            plugins: ["prettier-plugin-svelte"],
        });
    } catch (error) {
        // for some untypical file extensions prettier fails because
        // it's unable to find the appropriate parse. As this has only
        // to do with formatting and not functionality, we can
        // just skip formatting in this case.
        return content;
    }
}

export const commonFilePaths = {
    packageJsonFilePath: "package.json",
    svelteConfigFilePath: "svelte.config.js",
};
