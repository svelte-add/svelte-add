import { test } from "uvu";
import { fresh as svelteKit } from "@svelte-add/create-kit/__init.js";
// import { fresh as vite } from "@svelte-add/create-vite/__init.js";
import { runAdderTests } from "../../run-adder-tests.js";

async function executeTests() {
	await runAdderTests({
		adder: "graphql-server",
		scriptLanguage: "javascript",
		initializer: svelteKit,
		initializerName: "svelteKit",
		// initializer: vite,
		// initializerName: "vite",
		checkDependencies: false,
		useDemos: true,
	});

	test.run();
}

await executeTests();
