import { rm } from "fs/promises";
import { inspect } from "util";
import { test } from "uvu";
import * as assert from "uvu/assert";

import { adderDependencies, detectAdder, getEnvironment, runAdder } from "svelte-add";
import { fresh as svelteKit } from "@svelte-add/create-kit/__init.js";
import { fresh as vite } from "@svelte-add/create-vite/__init.js";

const initializers = { svelteKit, vite };
const adders = await readdir("node_modules/svelte-add/adders");

for (const [app, init] of Object.entries(initializers)) {
	for (const adderToTest of addersToTest) {

		/** @type {string[]} */
		const addersToCheck = [];
		const dependencies = adderDependencies[adderToTest];

		for (const dependency of dependencies) {
			// Move dependencies to the front such that
			// tailwindcss+postcss is rewritten as postcss+tailwindcss
			if (addersToCheck.includes(dependency)) addersToCheck.splice(addersToCheck.indexOf(dependency), 1);

			addersToCheck.unshift(dependency);
		}
		if (!addersToCheck.includes(adderToTest)) addersToCheck.push(adderToTest);
		
		test(`${adderToTest} being used on ${app} (without demos)`, async () => {
			const output = `_outputs/${app}_${adderToTest}`;
			await rm(output, {
				recursive: true,
				force: true,
			});

			await init({
				demo: false,
				dir: output,
				eslint: false,
				packageManager: "pnpm",
				prettier: false,
				typescript: false,
			});

			let environment = await getEnvironment({ cwd: output });

			/** @type {string[]} */
			const addersToRun = [];

			for (const adderToCheck of addersToCheck) {
				const preRunCheck = await detectAdder({
					adder: adderToCheck,
					cwd: output,
					environment,
				});
				assert.ok(Object.values(preRunCheck).every((pass) => !pass), `Somehow, pre-run checks show that ${adderToTest} is already set up: ${inspect(preRunCheck)}`);
				addersToRun.push(adderToCheck);
			}

			for (const adderToRun of addersToRun) {
				await runAdder({
					adder: adderToRun,
					cwd: output,
					environment,
					npx: "pnpx",
					options: { jit: true },
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
		})
	}
}

test.run();
