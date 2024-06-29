import fs from "node:fs/promises";
import path from "node:path";
import { executeCli } from "../utils/cli.js";
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
        await fs.mkdir(fullDirectoryPath, { recursive: true });
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

export async function format(workspace: WorkspaceWithoutExplicitArgs, paths: string[]) {
    await executeCli("npx", ["prettier", "--write", ...paths], workspace.cwd, { stdio: "pipe" });
}

export const commonFilePaths = {
    packageJsonFilePath: "package.json",
    svelteConfigFilePath: "svelte.config.js",
};
