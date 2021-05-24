/** @type {import("../..").AdderRun<{}>} */
export const run = async ({ applyPreset, environment, options }) => {
	// TODO: built-in implementation
	await applyPreset({
		args: [],
		preset: "svelte-add/postcss",
	});
};
