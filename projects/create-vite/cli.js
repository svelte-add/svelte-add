#!/usr/bin/env node
import { setup } from "@svelte-add/app-initializer-tools";
import { fresh } from "./__init.js";

const main = async () => {
	await setup({
		applicationFramework: "Vite-powered Svelte",
		fresh,
	});
};

main();
