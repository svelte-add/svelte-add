import { test } from "uvu";
import { getAddersList, getScriptLanguages } from "svelte-add";
import { fresh as svelteKit } from "@svelte-add/create-kit/__init.js";
import { fresh as vite } from "@svelte-add/create-vite/__init.js";
import { runAdderTests } from "../../run-adder-tests.js";

const initializers = { svelteKit, vite };
const languagesToCheck = getScriptLanguages();
const addersToTest = getAddersList();

async function executeTests() {
	for (const adderToTest of addersToTest) {
		for (const [app, init] of Object.entries(initializers)) {
			for (const language of languagesToCheck) {
				for (const passedDemos of [false, true]) {
					await runAdderTests({
						adder: adderToTest,
						scriptLanguage: language,
						initializer: init,
						initializerName: app,
						initializerQualities: [],
						checkDependencies: true,
						useDemos: passedDemos,
					});
				}
			}
		}
	}

	test.run();
}

await executeTests();
