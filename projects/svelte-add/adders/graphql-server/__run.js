/** @type {import("../..").AdderRun<import("./__info.js").Options>} */
export const run = async ({ applyPreset }) => {
	// TODO: built-in implementation
	await applyPreset({
		args: [],
		preset: "svelte-add/graphql",
	});
};
