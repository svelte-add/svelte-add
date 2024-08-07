import { join } from 'node:path';
import { cp, mkdir, writeFile } from 'node:fs/promises';
import { executeCli } from '@svelte-add/core';
import type { TestOptions } from '..';
import type { OptionValues, Question } from '@svelte-add/core/adder/options';

const templatesDirectory = 'templates';

export function getTemplatesDirectory(options: TestOptions) {
	return join(options.outputDirectory, templatesDirectory);
}

export async function installDependencies(output: string) {
	try {
		await executeCli('pnpm', ['install'], output, { stdio: 'pipe' });
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

export async function saveOptionsFile(
	workingDirectory: string,
	options: OptionValues<Record<string, Question>>,
) {
	const json = JSON.stringify(options);
	await writeFile(join(workingDirectory, 'options.json'), json);
}
