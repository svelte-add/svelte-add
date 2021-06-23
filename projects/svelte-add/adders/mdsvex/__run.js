/** @type {import("../..").AdderRun<import("./__metadata.js").Options>} */
export const run = async ({ applyPreset }) => {
	// TODO: built-in implementation
	await applyPreset({
		args: [],
		preset: "svelte-add/mdsvex",
	});
};
