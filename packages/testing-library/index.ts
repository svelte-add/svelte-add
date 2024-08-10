import {
	generateTestCases,
	prepareTests,
	runTestCases,
	finalizeTests,
} from './utils/test-cases.js';

export type TestOptions = {
	headless: boolean;
	pauseExecutionAfterBrowser: boolean;
	outputDirectory: string;
};

export { prepareTests, generateTestCases, runTestCases, finalizeTests };
