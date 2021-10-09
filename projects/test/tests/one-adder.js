import { rm } from "fs/promises";
import { inspect } from "util";
import { test } from "uvu";
import * as assert from "uvu/assert";

import { detectAdder, getChoices, getEnvironment, getFolderInfo, runAdder } from "svelte-add";
import { fresh as svelteKit } from "@svelte-add/create-kit/__init.js";
import { fresh as vite } from "@svelte-add/create-vite/__init.js";

const initializers = { svelteKit, vite };
// Replace this with the specific adder(s) to test
const addersToTest = ["tailwindcss"];

for (const [app, init] of Object.entries(initializers)) {
	for (const adderToTest of addersToTest) {
		for (const defaultDemos of [false, true]) {
			test(`${adderToTest} being used on ${app} (with demos: ${defaultDemos})`, async () => {
				const output = `_outputs/${app}_${adderToTest}_${defaultDemos}`;
				await rm(output, {
					recursive: true,
					force: true,
				});

				const environment = await getEnvironment();

				const { adderOptions, demos, deploy, npx, other, packageManager, projectDirectory, quality, script, styleFramework, styleLanguage } = await getChoices({
					defaultDemos,
					defaultInstall: false,
					environment,
					outputFolderMustBe: false,
					passedAddersAndPresets: [adderToTest],
					passedArgs: {},
					passedDemos: undefined,
					passedInstall: undefined,
					passedOutput: [output],
					passedPackageManager: "pnpm",
				});

				const features = [script, styleLanguage, ...(styleFramework ? [styleFramework] : []), ...other, ...quality, ...(deploy ? [deploy] : [])];
				const addersToCheck = features.filter((feature) => !["css", "javascript"].includes(feature));

				await init({
					demo: demos,
					dir: output,
					eslint: quality.includes("eslint"),
					packageManager,
					prettier: quality.includes("prettier"),
					runningTests: true,
					typescript: script === "typescript",
				});

				let folderInfo = await getFolderInfo({ projectDirectory: projectDirectory });

				/** @type {string[]} */
				const addersToRun = [];

				for (const adderToCheck of addersToCheck) {
					const preRunCheck = await detectAdder({
						adder: adderToCheck,
						folderInfo,
						projectDirectory: output,
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
						environment,
						folderInfo,
						npx,
						options: adderOptions[adderToRun],
						projectDirectory: output,
					});
					folderInfo = await getFolderInfo({ projectDirectory: projectDirectory });
				}

				for (const adderToCheck of addersToCheck) {
					const postRunCheck = await detectAdder({
						adder: adderToCheck,
						projectDirectory: output,
						folderInfo,
					});
					assert.ok(Object.values(postRunCheck).every(Boolean), `${adderToTest} was not set up correctly: ${inspect(postRunCheck)}`);
				}
			});
		}
	}
}

test.run();
