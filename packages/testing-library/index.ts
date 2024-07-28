import {
	generateTestCases,
	runAdderEndToEndTests,
	runAdderIntegrationTests,
} from './utils/test-cases';
import { prepareTests } from './utils/workspace';

export type TestOptions = {
	headless: boolean;
	pauseExecutionAfterBrowser: boolean;
	outputDirectory: string;
};

export { generateTestCases, runAdderEndToEndTests, runAdderIntegrationTests, prepareTests };
