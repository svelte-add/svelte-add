import { join } from "node:path";
import { mkdir } from "node:fs/promises";
import { ProjectTypesList } from "./create-project";
import { runTests } from "./test";
import { uid } from "uid";
import { startDevServer, stopDevServer } from "./dev-server";
import { startBrowser, stopBrowser } from "./browser-control";
import { getTemplatesDirectory, installDependencies, prepareWorkspaceWithTemplate, saveOptionsFile } from "./workspace";
import { runAdder } from "./adder";
import { prompts, remoteControl } from "@svelte-add/core/internal";
import type { AdderWithoutExplicitArgs } from "@svelte-add/core/adder/config";
import type { TestOptions } from "..";
import type { OptionValues, Question } from "@svelte-add/core/adder/options";

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
            if ((!environments.kit && template.includes("kit")) || (!environments.svelte && template.includes("svelte"))) {
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

export async function runAdderTests(
    template: string,
    adder: AdderWithoutExplicitArgs,
    options: OptionValues<Record<string, Question>>,
    testOptions: TestOptions,
) {
    if (!adder.tests)
        throw new Error(
            "The adder is not exporting any tests. Please make sure to properly define your tests while calling `defineAdder`",
        );

    remoteControl.enable();

    const output = join(testOptions.outputDirectory, adder.config.metadata.id, template, uid());
    await mkdir(output, { recursive: true });

    const workingDirectory = await prepareWorkspaceWithTemplate(output, template, getTemplatesDirectory(testOptions));
    await saveOptionsFile(workingDirectory, options);

    await runAdder(adder, workingDirectory, options);

    await installDependencies(workingDirectory);

    const { url, devServer } = await startDevServer(workingDirectory, adder.tests.command ?? "dev");
    const { browser, page } = await startBrowser(url, testOptions.headless);

    try {
        const errorOcurred = await page.$("vite-error-overlay");
        if (errorOcurred) throw new Error("Dev server failed to start correctly. Vite errors present");

        if (testOptions.pauseExecutionAfterBrowser) {
            await prompts.textPrompt("Browser opened! Press any key to continue!");
        }

        await runTests(page, adder, options);
    } finally {
        await stopBrowser(browser, page);
        await stopDevServer(devServer);
        remoteControl.disable();
    }
}

export type AdderError = {
    adder: string;
    template: string;
    message: string;
} & Error;
