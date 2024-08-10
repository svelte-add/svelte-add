import { join } from 'node:path';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { downloadProjectTemplates, ProjectTypes, ProjectTypesList } from './create-project';
import { runTests } from './test';
import { uid } from 'uid';
import { startDevServer, stopDevServer } from './dev-server';
import { openPage, startBrowser, stopBrowser } from './browser-control';
import {
	getTemplatesDirectory,
	installDependencies,
	prepareWorkspaceWithTemplate,
	saveOptionsFile,
} from './workspace';
import { prompts, remoteControl } from '@svelte-add/core/internal';
import type { AdderWithoutExplicitArgs } from '@svelte-add/core/adder/config';
import type { TestOptions } from '..';
import type { OptionValues, Question } from '@svelte-add/core/adder/options';
import { runAdder } from './adder';

export type TestCase = {
	template: string;
	adder: AdderWithoutExplicitArgs;
	options: OptionValues<Record<string, Question>>;
	runSynchronously: boolean;
	cwd?: string;
};

export function generateTestCases(adders: AdderWithoutExplicitArgs[]) {
	const testCases = new Map<string, TestCase[]>();
	for (const adder of adders) {
		const adderTestCases: TestCase[] = [];
		testCases.set(adder.config.metadata.id, adderTestCases);

		for (const template of ProjectTypesList) {
			const runSynchronously = adder.tests?.runSynchronously ?? false;

			const environments = adder.config.metadata.environments;
			if (
				(!environments.kit && template.includes('kit')) ||
				(!environments.svelte && template.includes('svelte'))
			) {
				continue;
			}

			const optionsList = adder.tests?.optionValues;
			if (optionsList && optionsList.length > 0) {
				for (const options of optionsList) {
					adderTestCases.push({ adder, template, options, runSynchronously });
				}
			} else {
				// if no explicit test cases are defined this adder
				// presumably does not have any options, so just test the default.
				const options: OptionValues<Record<string, Question>> = {};
				adderTestCases.push({ adder, template, options, runSynchronously });
			}
		}
	}
	return testCases;
}

export async function prepareAdder(
	template: string,
	adder: AdderWithoutExplicitArgs,
	options: OptionValues<Record<string, Question>>,
	testOptions: TestOptions,
) {
	if (!adder.tests)
		throw new Error(
			'The adder is not exporting any tests. Please make sure to properly define your tests while calling `defineAdder`',
		);

	const output = join(testOptions.outputDirectory, adder.config.metadata.id, template, uid());
	await mkdir(output, { recursive: true });

	const workingDirectory = await prepareWorkspaceWithTemplate(
		output,
		template,
		getTemplatesDirectory(testOptions),
	);
	await saveOptionsFile(workingDirectory, options);

	return workingDirectory;
}

export async function executeAdderTests(
	workingDirectory: string,
	adder: AdderWithoutExplicitArgs,
	options: OptionValues<Record<string, Question>>,
	testOptions: TestOptions,
) {
	if (!adder.tests) return;

	const cmd = adder.tests.command ?? 'dev';
	const { url, devServer } = await startDevServer(workingDirectory, cmd);
	const page = await openPage(url);

	try {
		const errorOcurred = await page.$('vite-error-overlay');
		if (errorOcurred) throw new Error('Dev server failed to start correctly. Vite errors present');

		if (testOptions.pauseExecutionAfterBrowser) {
			await prompts.textPrompt('Browser opened! Press any key to continue!');
		}

		await runTests(page, adder, options);
	} finally {
		await page.close();
		await stopDevServer(devServer);
	}
}

export type AdderError = {
	adder: string;
	template: string;
	message: string;
} & Error;

export function runTestCases(
	testCases: Map<string, TestCase[]>,
	testOptions: TestOptions,
	testGroup: (name: string, testFactory: () => void) => {},
	test: (name: string, testFunction: () => Promise<void> | void) => void,
) {
	const tests: Map<string, TestCase[]> = new Map();
	remoteControl.enable();

	for (const [adderId, cases] of testCases.entries()) {
		for (const testCase of cases) {
			if (testCase.adder.tests?.tests.length === 0) continue;

			let adderTests = tests.get(adderId);
			if (!adderTests) {
				adderTests = [];
			}

			adderTests.push(testCase);

			tests.set(adderId, adderTests);
		}
	}

	for (const adderId of tests.keys()) {
		testGroup(adderId, () => {
			for (const testCase of tests.get(adderId) ?? []) {
				let testName = `${adderId} / ${testCase.template}`;

				// only add options to name, if the test case has options
				if (testCase.options && Object.keys(testCase.options).length > 0)
					testName = `${testName} / ${JSON.stringify(testCase.options)}`;

				test(testName, async () => {
					try {
						if (!testCase.cwd) throw new Error('TestCase working directory not set');

						await executeAdderTests(testCase.cwd, testCase.adder, testCase.options, testOptions);
					} catch (e) {
						const error = e as Error;
						const adderError: AdderError = {
							name: 'AdderError',
							adder: testCase.adder.config.metadata.id,
							template: testCase.template,
							message: error.message,
						};
						throw adderError;
					}
				});
			}
		});
	}
}

export async function prepareTests(
	options: TestOptions,
	adders: AdderWithoutExplicitArgs[],
	testCasesPerAdder: Map<string, TestCase[]>,
	testOptions: TestOptions,
) {
	console.log('deleting old files');
	await rm(options.outputDirectory, { recursive: true, force: true });

	console.log('downloading project templates');
	const templatesOutputDirectory = getTemplatesDirectory(options);
	await downloadProjectTemplates(templatesOutputDirectory);

	const dirs: string[] = [];
	for (const type of Object.values(ProjectTypes)) {
		dirs.push(...adders.map((a) => `  - '${a.config.metadata.id}/${type}/*'`));
	}

	const pnpmWorkspace = `packages:\n${dirs.join('\n')}\n`;
	await writeFile(join(options.outputDirectory, 'pnpm-workspace.yaml'), pnpmWorkspace, {
		encoding: 'utf8',
	});

	const testRootPkgJson = JSON.stringify({ name: 'test-root', version: '0.0.0', type: 'module' });
	await writeFile(join(options.outputDirectory, 'package.json'), testRootPkgJson, {
		encoding: 'utf8',
	});

	console.log('executing adders');
	for (const testCases of testCasesPerAdder.values()) {
		for (const testCase of testCases) {
			testCase.cwd = await prepareAdder(
				testCase.template,
				testCase.adder,
				testCase.options,
				testOptions,
			);
			await runAdder(testCase.adder, testCase.cwd, testCase.options);
		}
	}

	console.log('installing dependencies');
	await installDependencies(testOptions.outputDirectory);

	await startBrowser(options.headless);
	remoteControl.enable();

	console.log('start testing');
}

export async function finalizeTests() {
	await stopBrowser();
	remoteControl.disable();
}
