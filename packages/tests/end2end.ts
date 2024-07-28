import * as path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
	generateTestCases,
	prepareTests,
	runAdderEndToEndTests,
} from '@svelte-add/testing-library';
import { test, describe, beforeAll } from 'vitest';
import { getAdders } from './common/adders';

let usingDocker = false;

/** @type {import("../testing-library/index.js").TestOptions} */
const testOptions = {
	headless: true,
	pauseExecutionAfterBrowser: false,
	outputDirectory: path.join(process.cwd(), '.outputs', 'end2end'),
};

beforeAll(async () => {
	await prepareTests(testOptions.outputDirectory);
});

async function executeTests() {
	const adders = await getAdders();

	usingDocker = !!adders.find((adder) => adder.config.metadata.id === 'drizzle');
	if (usingDocker) startDocker();

	const adderTestCases = generateTestCases(adders);
	for (const [adderId, testCases] of adderTestCases) {
		describe(adderId, () => {
			for (const testCase of testCases) {
				let testName = `${adderId} / ${testCase.template}`;

				// only add options to name, if the test case has options
				if (testCase.options && Object.keys(testCase.options).length > 0)
					testName = `${testName} / ${JSON.stringify(testCase.options)}`;

				const testMethod = testCase.runSynchronously ? test : test.concurrent;
				testMethod.skip(testName, async () => {
					await runAdderEndToEndTests(
						testCase.template,
						testCase.adder,
						testCase.options,
						testOptions,
					);
				});
			}
		});
	}
}

const cwd = path.resolve(fileURLToPath(import.meta.url), '..');

// We're using `execSync` instead of our `executeCli` because we need the cleanup to be synchronous
function startDocker() {
	console.log('Starting docker containers');
	execSync('docker compose up --detach', { cwd, stdio: 'pipe' });
}

function stopDocker() {
	if (!usingDocker) return;
	console.log('Stopping docker containers');
	execSync('docker compose down --volumes', { cwd, stdio: 'pipe' });
	usingDocker = false;
}

process.on('exit', stopDocker);
process.on('SIGINT', stopDocker);

await executeTests();
