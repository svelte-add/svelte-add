/** @type {import("../..").AdderRun<{}>} */
export const run = async ({ applyPreset, environment, options }) => {
	// TODO: built-in implementation
	await applyPreset({
		args: [],
		npx: environment.packageManagers.pnpm ? "pnpx" : "npx",
		preset: "svelte-add/graphql",
	});
};
