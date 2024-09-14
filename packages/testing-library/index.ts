import path from 'node:path';
import fs from 'node:fs';
import { rm } from 'node:fs/promises';
import { generateTestCases, runTestCases } from './utils/test-cases';
import { getTemplatesDirectory } from './utils/workspace';
import { downloadProjectTemplates, ProjectTypes } from './utils/create-project';
import { remoteControl } from '@svelte-add/core/internal';
import type { AdderWithoutExplicitArgs } from '@svelte-add/core/adder/config';

export type TestOptions = {
	headless: boolean;
	pauseExecutionAfterBrowser: boolean;
	outputDirectory: string;
};

export async function testAdder(adder: AdderWithoutExplicitArgs, options: TestOptions) {
	await testAdders([adder], options);
}

export async function testAdders(adders: AdderWithoutExplicitArgs[], options: TestOptions) {
	await prepareTests(options);

	const dirs: string[] = [];
	for (const type of Object.values(ProjectTypes)) {
		dirs.push(...adders.map((a) => `  - '${a.config.metadata.id}/${type}/*'`));
	}

	const pnpmWorkspace = `packages:\n${dirs.join('\n')}\n`;
	fs.writeFileSync(path.join(options.outputDirectory, 'pnpm-workspace.yaml'), pnpmWorkspace, {
		encoding: 'utf8',
	});

	const testRootPkgJson = JSON.stringify({ name: 'test-root', version: '0.0.0', type: 'module' });
	fs.writeFileSync(path.join(options.outputDirectory, 'package.json'), testRootPkgJson, {
		encoding: 'utf8',
	});

	remoteControl.enable();
	await executeTests(adders, options);
	remoteControl.disable();
}

export async function executeTests(adders: AdderWithoutExplicitArgs[], options: TestOptions) {
	console.log('generating test cases');
	const testCases = generateTestCases(adders);

	console.log('start testing');
	await runTestCases(testCases, options);
}

async function prepareTests(options: TestOptions) {
	console.log('deleting old files');
	await rm(options.outputDirectory, { recursive: true, force: true });

	console.log('downloading project templates');
	const templatesOutputDirectory = getTemplatesDirectory(options);
	await downloadProjectTemplates(templatesOutputDirectory);
}
