import * as path from 'node:path';
import {
	generateTestCases,
	prepareTests,
	runAdderIntegrationTests,
} from '@svelte-add/testing-library';
import { test, describe, beforeAll } from 'vitest';
import { getAdders } from './common/adders';
import { mkdir, readFile } from 'node:fs/promises';

const outputDirectory = path.join(process.cwd(), '.outputs', 'integration');
const snapshotDirectory = path.join(process.cwd(), '.snapshots', 'integration');

beforeAll(async () => {
	await prepareTests(outputDirectory);
});

async function executeTests() {
	const adders = await getAdders();
	// we don't now which files changed for external adders, so there is no need to
	// execute them at all.
	const inlineAdders = adders.filter((x) => x.config.integrationType == 'inline');

	const adderTestCases = generateTestCases(inlineAdders);
	for (const [adderId, testCases] of adderTestCases) {
		describe(adderId, () => {
			for (const testCase of testCases) {
				let testName = `${adderId} / ${testCase.template}`;

				// only add options to name, if the test case has options
				if (testCase.options && Object.keys(testCase.options).length > 0)
					testName = `${testName} / ${JSON.stringify(testCase.options)}`;

				const testMethod = testCase.runSynchronously ? test : test.concurrent;
				testMethod(testName, async ({ expect }) => {
					const adder = adders.find((x) => x.config.metadata.id == adderId);
					if (!adder) throw new Error('Unable to find adder');

					const executionResult = await runAdderIntegrationTests(testCase, outputDirectory, adder);

					if (!executionResult || !executionResult.success)
						throw new Error('Adder was not applied successfully');

					const testCaseSnapshotDirectory = executionResult.outputDirectory.replace(
						outputDirectory,
						snapshotDirectory,
					);
					await mkdir(testCaseSnapshotDirectory, { recursive: true });

					if (!executionResult.changedFiles) return;

					for (const filePath of executionResult.changedFiles) {
						const contentBuffer = await readFile(
							path.join(executionResult.outputDirectory, filePath),
						);
						const content = contentBuffer.toString();

						const snapshotFilePath = path.join(testCaseSnapshotDirectory, filePath);
						await expect(content).toMatchFileSnapshot(snapshotFilePath, filePath);
					}
				});
			}
		});
	}
}

await executeTests();
