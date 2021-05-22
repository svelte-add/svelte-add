/** @type {import("../..").AdderRun<{ jit: boolean }>} */
export const run = async ({ applyPreset, environment, options }) => {
	// TODO: built-in implementation
	await applyPreset({
		args: ["--jit", options.jit ? "true" : "false"],
		npx: environment.packageManagers.pnpm ? "pnpx" : "npx",
		preset: "svelte-add/tailwindcss",
	});
};
