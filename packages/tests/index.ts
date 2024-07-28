import * as path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { generateTestCases, prepareTests, runAdderTests } from '@svelte-add/testing-library';
import { adderIds } from '@svelte-add/config';
import { remoteControl } from '@svelte-add/core/internal';
import type { AdderWithoutExplicitArgs } from '@svelte-add/core/adder/config';
import { getAdderDetails } from '@svelte-add/adders';
import { test, describe, beforeAll } from 'vitest';

let usingDocker = false;

/** @type {import("../testing-library/index.js").TestOptions} */
const testOptions = {
	headless: true,
	pauseExecutionAfterBrowser: false,
	outputDirectory: path.join(process.cwd(), '.outputs'),
};

beforeAll(async () => {
	await prepareTests(testOptions);
});

async function executeTests() {
	const adders: AdderWithoutExplicitArgs[] = [];

	for (const adderName of adderIds) {
		adders.push(await getAdder(adderName));
	}

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
				testMethod(testName, async () => {
					await runAdderTests(testCase.template, testCase.adder, testCase.options, testOptions);
				});
			}
		});
	}
}

async function getAdder(adderName: string) {
	remoteControl.enable();

	const adder = await getAdderDetails(adderName);

	remoteControl.disable();

	return adder;
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
