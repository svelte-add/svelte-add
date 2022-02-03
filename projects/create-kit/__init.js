import path from "path";

import { create } from "create-svelte";

/** @type {import("@svelte-add/app-initializer-tools").Initializer} */
export const fresh = async ({ demo, dir, eslint, prettier, typescript }) => {
	await create(dir, {
		name: path.basename(path.resolve(dir)),
		eslint,
		prettier,
		template: demo ? "default" : "skeleton",
		typescript,
	});
};
