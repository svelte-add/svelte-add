import path from "path";

import { create } from "create-svelte";

/** @type {import("@svelte-add/app-initializer-tools").Initializer} */
export const fresh = async ({ demo, dir, eslint, playwright, prettier, types }) => {
	await create(dir, {
		name: path.basename(path.resolve(dir)),
		eslint,
		playwright,
		prettier,
		template: demo ? "default" : "skeleton",
		types,
		vitest: false, // TODO: add a vitest feature
	});
};
