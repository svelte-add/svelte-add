import { join } from 'node:path';
import { cp, mkdir, rm } from 'node:fs/promises';
import { executeCli } from '@svelte-add/core';
import { downloadProjectTemplates } from './create-project';

const templatesDirectory = 'templates';

export function getTemplatesDirectory(outputDirectory: string) {
	return join(outputDirectory, templatesDirectory);
}

export async function installDependencies(output: string) {
	try {
		// Since tests are executed and installed within this repo (packages/tests/.outputs),
		// we need to add the `--ignore-workspace` flag so that our root lockfile isn't modified
		await executeCli('npm', ['install', '--ignore-workspace'], output, { stdio: 'pipe' });
	} catch (error) {
		const typedError = error as Error;
		throw new Error('unable to install dependencies: ' + typedError.message);
	}
}

export async function prepareWorkspaceWithTemplate(
	output: string,
	template: string,
	templatesOutputDirectory: string,
) {
	const templateDirectory = join(templatesOutputDirectory, template);
	await mkdir(output, { recursive: true });
	await cp(templateDirectory, output, { recursive: true });

	return output;
}

export async function prepareTests(outputDirectory: string) {
	console.log('deleting old files');
	await rm(outputDirectory, { recursive: true, force: true });

	console.log('downloading project templates');
	const templatesOutputDirectory = getTemplatesDirectory(outputDirectory);
	await downloadProjectTemplates(templatesOutputDirectory);
}
