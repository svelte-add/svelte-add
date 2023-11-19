import { rm } from "fs/promises";
import { detectAdder, getAdderInfo, getChoices, getEnvironment, getFolderInfo, getSupportedInitializers, installDependencies, runAdder } from "svelte-add";
import { inspect } from "util";
import { test } from "uvu";
import * as assert from "uvu/assert";

/**
 * Runs the tests for one adder
 * @param {object} param0
 * @param {import("svelte-add").NonScriptAdders} param0.adder adder to test
 * @param {import("svelte-add").Script} param0.scriptLanguage script language
 * @param {import("@svelte-add/app-initializer-tools").Initializer} param0.initializer initializer to test
 * @param {string} param0.initializerName initializer name to test
 * @param {import("svelte-add").Quality[]} param0.initializerQualities qualities to initialize
 * @param {boolean} param0.useDemos use initializer demo app
 * @param {boolean} param0.checkDependencies whether to install dependencies or ignore them
 */
export async function runAdderTests({ adder, scriptLanguage, initializer, initializerName, initializerQualities, useDemos, checkDependencies }) {
	const adderInfo = await getAdderInfo({ adder: adder });

	const testName = `${adder} being used on ${initializerName}/${scriptLanguage} (with demos: ${useDemos})`;
	const output = `_outputs/${initializerName}_${scriptLanguage}_${adder}_${useDemos}`;
	let folderInfo = await getFolderInfo({ projectDirectory: output });
	const supportedInitializers = await getSupportedInitializers({ folderInfo, adderInfo });

	if ((initializerName === "svelteKit" && !supportedInitializers.kit) || (initializerName === "vite" && !supportedInitializers.vite)) {
		test.skip(testName);
		return;
	}

	test(testName, async () => {
		process.stdout.write("\nname: " + testName + " / status: ");

		await rm(output, {
			recursive: true,
			force: true,
		});

		const environment = await getEnvironment();

		const { adderOptions, demos, deploy, npx, other, packageManager, projectDirectory, quality, script, styleFramework, styleLanguage } = await getChoices({
			defaultInstall: false,
			environment,
			outputFolderMustBe: false,
			passedFeatures: [adder, scriptLanguage],
			passedArgs: {},
			passedDemos: useDemos,
			passedInstall: false,
			passedOutput: [output],
			passedPackageManager: "pnpm",
		});

		const features = [script, styleLanguage, ...(styleFramework ? [styleFramework] : []), ...other, ...quality, ...(deploy ? [deploy] : [])];
		const addersToCheck = features.filter((feature) => !["css", "javascript", "typescript"].includes(feature));

		await initializer({
			demo: demos,
			dir: output,
			eslint: [...initializerQualities, ...quality].includes("eslint"),
			packageManager,
			platform: environment.platform,
			playwright: [...initializerQualities, ...quality].includes("playwright"),
			prettier: [...initializerQualities, ...quality].includes("prettier"),
			runningTests: true,
			// TODO: prompt for and check if type-checked javascript was chosen
			types: script === "typescript" ? "typescript" : null,
			vitest: [...initializerQualities, ...quality].includes("vitest"),
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
				`Somehow, pre-run checks show that ${adder} is already set up: ${inspect(preRunCheck)}`
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
			assert.ok(Object.values(postRunCheck).every(Boolean), `${adder} was not set up correctly: ${inspect(postRunCheck)}`);
		}

		if (checkDependencies) {
			// If this below codes fails, it will throw an exception, which will cause the complete test to fail.
			// Always use npm here, as using pnpm will add the packages to the workspace, which is not the intended behavior here.
			await installDependencies({ packageManager: "npm", platform: environment.platform, projectDirectory: output });
		}
	});
}
