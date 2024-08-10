#!/usr/bin/env node

import * as path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
	finalizeTests,
	generateTestCases,
	prepareTests,
	runTestCases,
} from '@svelte-add/testing-library';
import { describe, test, beforeAll, afterAll } from 'vitest';
import { getAllAdders } from './common/adder.js';

let usingDocker = false;
const cwd = path.resolve(fileURLToPath(import.meta.url), '..');

/** @type {import("../testing-library/index.js").TestOptions} */
const testOptions = {
	headless: true,
	pauseExecutionAfterBrowser: false,
	outputDirectory: path.join(process.cwd(), '.outputs'),
};

const adders = await getAllAdders();
const testCasesPerAdder = generateTestCases(adders);

beforeAll(async () => {
	await prepareTests(testOptions, adders, testCasesPerAdder, testOptions);
});

afterAll(async () => {
	await finalizeTests();
});

executeTests();

function executeTests() {
	usingDocker = !!adders.find((adder) => adder.config.metadata.id === 'drizzle');
	if (usingDocker) startDocker();

	runTestCases(testCasesPerAdder, testOptions, describe, test.concurrent);
}

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
