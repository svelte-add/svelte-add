import { AdderWithoutExplicitArgs } from "@svelte-add/core/adder/config";
import { generateTestCases, runTestCases } from "./utils/test-cases";
import { rm } from "fs/promises";
import { getTemplatesDirectory } from "./utils/workspace";
import { downloadProjectTemplates } from "./utils/create-project";
import { remoteControl } from "@svelte-add/core/internal";

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

    remoteControl.enable();
    await executeTests(adders, options);
    remoteControl.disable();
}

export async function executeTests(adders: AdderWithoutExplicitArgs[], options: TestOptions) {
    console.log("generating test cases");
    let testCases = await generateTestCases(adders);

    console.log("start testing");
    await runTestCases(testCases, options);
}

async function prepareTests(options: TestOptions) {
    console.log("deleting old files");
    await rm(options.outputDirectory, { recursive: true, force: true });

    console.log("downloading project templates");
    const templatesOutputDirectory = getTemplatesDirectory(options);
    await downloadProjectTemplates(templatesOutputDirectory);
}
