import fs from 'node:fs/promises';
import path from 'node:path';
import { executeCli } from '../utils/cli.js';
import type { WorkspaceWithoutExplicitArgs } from '../utils/workspace';

export async function readFile(workspace: WorkspaceWithoutExplicitArgs, filePath: string) {
	const fullFilePath = getFilePath(workspace.cwd, filePath);

	if (!(await fileExistsWorkspace(workspace, filePath))) {
		return '';
	}

	const buffer = await fs.readFile(fullFilePath);
	const text = buffer.toString();

	return text;
}

export async function writeFile(
	workspace: WorkspaceWithoutExplicitArgs,
	filePath: string,
	content: string,
) {
	const fullFilePath = getFilePath(workspace.cwd, filePath);
	const fullDirectoryPath = path.dirname(fullFilePath);

	if (content && !content.endsWith('\n')) content += '\n';

	if (!(await directoryExists(fullDirectoryPath))) {
		await fs.mkdir(fullDirectoryPath, { recursive: true });
	}

	await fs.writeFile(fullFilePath, content);
}

export async function fileExistsWorkspace(
	workspace: WorkspaceWithoutExplicitArgs,
	filePath: string,
) {
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
	await executeCli('npx', ['prettier', '--write', '--ignore-unknown', ...paths], workspace.cwd, {
		stdio: 'pipe',
	});
}

export const commonFilePaths = {
	packageJsonFilePath: 'package.json',
	svelteConfigFilePath: 'svelte.config.js',
};

export async function findUp(searchPath: string, fileName: string, maxDepth?: number) {
	// partially sourced from https://github.com/privatenumber/get-tsconfig/blob/9e78ec52d450d58743439358dd88e2066109743f/src/utils/find-up.ts#L5
	let depth = 0;
	while (!maxDepth || depth < maxDepth) {
		const configPath = path.posix.join(searchPath, fileName);

		try {
			// `access` throws an exception if the file could not be found
			await fs.access(configPath);
			return true;
		} catch {
			const parentPath = path.dirname(searchPath);
			if (parentPath === searchPath) {
				// root directory
				return false;
			}

			searchPath = parentPath;
		}

		depth++;
	}

	return false;
}
