import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { ProjectTypesList } from './create-project';
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
import { runAdder } from './adder';
import { prompts } from '@svelte-add/core/internal';
import * as Throttle from 'promise-parallel-throttle';
import type { AdderWithoutExplicitArgs } from '@svelte-add/core/adder/config';
import type { TestOptions } from '..';
import type { OptionValues, Question } from '@svelte-add/core/adder/options';

export type TestCase = {
	template: string;
	adder: AdderWithoutExplicitArgs;
	options: OptionValues<Record<string, Question>>;
	runSynchronously: boolean;
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

export async function setupAdder(
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

	await runAdder(adder, workingDirectory, options);

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

export async function runTestCases(testCases: Map<string, TestCase[]>, testOptions: TestOptions) {
	const asyncTasks: Array<() => Promise<void>> = [];
	const syncTasks: Array<() => Promise<void>> = [];
	const asyncTestCaseInputs: TestCase[] = [];
	const syncTestCaseInputs: TestCase[] = [];
	const tests: { testCase: TestCase; cwd: string }[] = [];

	console.log('executing adders');
	for (const cases of testCases.values()) {
		for (const testCase of cases) {
			if (testCase.adder.tests?.tests.length === 0) continue;
			const cwd = await setupAdder(
				testCase.template,
				testCase.adder,
				testCase.options,
				testOptions,
			);
			tests.push({ testCase, cwd });
		}
	}

	console.log('installing dependencies');
	await installDependencies(testOptions.outputDirectory);

	await startBrowser(testOptions.headless);

	console.log('running tests');
	for (const { cwd, testCase } of tests) {
		const taskExecutor = async () => {
			try {
				await executeAdderTests(cwd, testCase.adder, testCase.options, testOptions);
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
		};

		if (testCase.runSynchronously) {
			syncTasks.push(taskExecutor);
			syncTestCaseInputs.push(testCase);
		} else {
			asyncTasks.push(taskExecutor);
			asyncTestCaseInputs.push(testCase);
		}
	}

	let testProgressCount = 0;
	const overallTaskCount = asyncTasks.length + syncTasks.length;
	const parallelTasks = testOptions.pauseExecutionAfterBrowser ? 1 : ProjectTypesList.length;

	const allAsyncResults = await Throttle.raw(asyncTasks, {
		failFast: false,
		maxInProgress: parallelTasks,
		progressCallback: (result) => {
			testProgressCount++;
			logTestProgress(
				testProgressCount,
				overallTaskCount,
				result.amountResolved,
				result.amountRejected,
				asyncTestCaseInputs[result.lastCompletedIndex],
			);
		},
	});

	const allSyncResults = await Throttle.raw(syncTasks, {
		failFast: false,
		maxInProgress: 1,
		progressCallback: (result) => {
			testProgressCount++;
			logTestProgress(
				testProgressCount,
				overallTaskCount,
				allAsyncResults.amountResolved + result.amountResolved,
				allAsyncResults.amountRejected + result.amountRejected,
				syncTestCaseInputs[result.lastCompletedIndex],
			);
		},
	});

	await stopBrowser();

	const rejectedAsyncPromisesResult = allAsyncResults.rejectedIndexes.map<AdderError>(
		(x) => allAsyncResults.taskResults[x] as unknown as AdderError,
	);
	const rejectedSyncPromisesResult = allSyncResults.rejectedIndexes.map<AdderError>(
		(x) => allSyncResults.taskResults[x] as unknown as AdderError,
	);

	const rejectedPromisesResult = [...rejectedAsyncPromisesResult, ...rejectedSyncPromisesResult];
	for (const error of rejectedPromisesResult) {
		console.log(`${error.adder} (${error.template}): ${error.message}`);
	}

	if (rejectedPromisesResult.length > 0) {
		console.log('At least one test failed. Exiting.');
		process.exit(1);
	}

	if (testProgressCount != overallTaskCount) {
		console.log(
			`Number of executed tests (${testProgressCount.toString()}) does not match number of expected tests (${overallTaskCount.toString()}). Tests failed!`,
		);
		process.exit(1);
	}
}

function logTestProgress(
	current: number,
	total: number,
	success: number,
	failed: number,
	testCaseInput: TestCase,
) {
	const length = total.toString().length;
	const zeroPad = (num: number) => String(num).padStart(length, '0');

	console.log(
		`Total: ${zeroPad(current)} / ${total.toString()} Success: ${zeroPad(success)} Failed: ${zeroPad(failed)} (${testCaseInput.adder.config.metadata.id} / ${testCaseInput.template})`,
	);
}
