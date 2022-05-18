export const name = "Playwright";

/** @type {import("../..").Gatekeep} */
export const gatekeep = async ({ folderInfo }) => {
	if (!folderInfo.empty)
		return {
			advice: "can only be selected when initializing an app",
		};

	return { able: true };
};

/** @typedef {{}} Options */

/** @type {import("../..").AdderOptions<Options>} */
export const options = {};

/** @type {import("../..").Heuristic[]} */
export const heuristics = [
	{
		description: "`@playwright/test` is installed",
		async detector({ folderInfo }) {
			return "@playwright/test" in folderInfo.allDependencies;
		},
	},
	{
		description: "`playwright.config.js` or `playwright.config.ts` exists",
		async detector({ readFile }) {
			const js = await readFile({ path: "/playwright.config.js" });
			const ts = await readFile({ path: "/playwright.config.ts" });

			return js.exists || ts.exists;
		},
	},
];
