import { rm } from "fs/promises";
import { inspect } from "util";
import { test } from "uvu";
import * as assert from "uvu/assert";

import { detectAdder, getChoices, getEnvironment, getToolCommand, packageManagers, runAdder } from "svelte-add";
import { fresh as svelteKit } from "@svelte-add/create-kit/__init.js";
import { fresh as vite } from "@svelte-add/create-vite/__init.js";

const initializers = { svelteKit, vite };
// Replace this with the specific adder(s) to test
const addersToTest = ["tailwindcss"];

for (const [app, init] of Object.entries(initializers)) {
	for (const adderToTest of addersToTest) {
		test(`${adderToTest} being used on ${app} (without demos)`, async () => {
			const output = `_outputs/${app}_${adderToTest}`;
			await rm(output, {
				recursive: true,
				force: true,
			});

			let environment = await getEnvironment({ cwd: output });

			const choices = await getChoices({ addersAndPresets: [adderToTest], environment, install: false, parsedArgs: {} });
			const packageManagerCommand = getToolCommand({ platform: environment.platform, tool: choices.packageManager, tools: packageManagers });

			/** @type {string[]} */
			const addersToCheck = [];
			if (choices.script !== "javascript") addersToCheck.push(choices.script);
			if (choices.styleLanguage !== "css") addersToCheck.push(choices.styleLanguage);
			if (choices.styleFramework) addersToCheck.push(choices.styleFramework);
			addersToCheck.push(...choices.other);
			addersToCheck.push(...choices.quality);

			await init({
				demo: choices.demos,
				dir: output,
				eslint: choices.quality.includes("eslint"),
				packageManagerCommand,
				prettier: choices.quality.includes("prettier"),
				runningTests: true,
				typescript: choices.script === "typescript",
			});

			environment = await getEnvironment({ cwd: output });

			/** @type {string[]} */
			const addersToRun = [];

			for (const adderToCheck of addersToCheck) {
				const preRunCheck = await detectAdder({
					adder: adderToCheck,
					cwd: output,
					environment,
				});
				assert.ok(
					Object.values(preRunCheck).some((pass) => !pass),
					`Somehow, pre-run checks show that ${adderToTest} is already set up: ${inspect(preRunCheck)}`
				);
				addersToRun.push(adderToCheck);
			}

			for (const adderToRun of addersToRun) {
				await runAdder({
					adder: adderToRun,
					cwd: output,
					environment,
					npx: choices.npx,
					options: choices.adderOptions[adderToRun],
				});
				environment = await getEnvironment({ cwd: output });
			}

			for (const adderToCheck of addersToCheck) {
				const postRunCheck = await detectAdder({
					adder: adderToCheck,
					cwd: output,
					environment,
				});
				assert.ok(Object.values(postRunCheck).every(Boolean), `${adderToTest} was not set up correctly: ${inspect(postRunCheck)}`);
			}
		});
	}
}

test.run();
