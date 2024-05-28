#!/usr/bin/env node

import { testAdders } from "@svelte-add/testing-library";
import { getAdderList } from "svelte-add/website";
import { remoteControl } from "@svelte-add/core/internal";
import path from "path";

/** @type {import("../testing-library/index.js").TestOptions} */
const testOptions = {
    headless: true,
    pauseExecutionAfterBrowser: false,
    outputDirectory: path.join(process.cwd(), "packages", "tests", ".outputs"),
};

void test();

async function test() {
    const addersToTest = process.argv.slice(2);
    if (addersToTest.length > 0) console.log("Only testing the following adders", addersToTest);

    await executeTests(addersToTest);
}

/**
 * Executes the tests
 * @param {string[]} addersToTest
 */
async function executeTests(addersToTest) {
    const filterAdders = addersToTest.length > 0;
    const adderNames = getAdderList();

    /** @type {import("@svelte-add/core/adder/config.js").AdderWithoutExplicitArgs[]} */
    const adders = [];

    for (const adderName of adderNames) {
        if (filterAdders && !addersToTest.includes(adderName)) continue;

        adders.push(await getAdder(adderName));
    }

    await testAdders(adders, testOptions);
}

/**
 * Fetches the adder and all it's details
 * @param {string} adderName
 * @returns
 */
async function getAdder(adderName) {
    remoteControl.enable();

    /** @type {{default: import("@svelte-add/core/adder/config.js").AdderWithoutExplicitArgs}} */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const adderModule = await import(`../../adders/${adderName}/build/index.js`);
    const adder = adderModule.default;

    remoteControl.disable();

    return adder;
}
