#!/usr/bin/env node

import * as path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { testAdders } from "@svelte-add/testing-library";
import { getAdderList } from "svelte-add/website";
import { remoteControl } from "@svelte-add/core/internal";
import type { AdderWithoutExplicitArgs } from "@svelte-add/core/adder/config";

let usingDocker = false;

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
async function executeTests(addersToTest: string[]) {
    const filterAdders = addersToTest.length > 0;
    const adderNames = getAdderList();

    /** @type {import("@svelte-add/core/adder/config.js").AdderWithoutExplicitArgs[]} */
    const adders = [];

    for (const adderName of adderNames) {
        if (filterAdders && !addersToTest.includes(adderName)) continue;

        adders.push(await getAdder(adderName));
    }

    usingDocker = !!adders.find((adder) => adder.config.metadata.id === "drizzle");
    if (usingDocker) startDocker();

    await testAdders(adders, testOptions);
}

/**
 * Fetches the adder and all it's details
 * @param {string} adderName
 * @returns
 */
async function getAdder(adderName: string) {
    remoteControl.enable();

    const adderModule = (await import(`../../adders/${adderName}/index.ts`)) as { default: AdderWithoutExplicitArgs };
    const adder = adderModule.default;

    remoteControl.disable();

    return adder;
}

const cwd = path.resolve(fileURLToPath(import.meta.url), "..");

// We're using `execSync` instead of our `executeCli` because we need the cleanup to be synchronous
function startDocker() {
    console.log("Starting docker containers");
    execSync("docker compose up --detach", { cwd, stdio: "pipe" });
}

function stopDocker() {
    if (!usingDocker) return;
    console.log("Stopping docker containers");
    execSync("docker compose down --volumes", { cwd, stdio: "pipe" });
    usingDocker = false;
}

process.on("exit", stopDocker);
process.on("SIGINT", stopDocker);
