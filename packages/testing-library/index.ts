import { generateTestCases, runAdderTests } from './utils/test-cases';
import { prepareTests } from './utils/workspace';

export type TestOptions = {
	headless: boolean;
	pauseExecutionAfterBrowser: boolean;
	outputDirectory: string;
};

export { generateTestCases, runAdderTests, prepareTests };
