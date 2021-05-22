/** @type {import("../..").AdderRun<{ project: string }>} */
export const run = async ({ applyPreset, environment, options }) => {
	// TODO: built-in implementation
	await applyPreset({
		args: ["--project", options.project],
		npx: environment.packageManagers.pnpm ? "pnpx" : "npx",
		preset: "svelte-add/firebase-hosting",
	});
};
