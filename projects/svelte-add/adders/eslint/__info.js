export const name = "ESLint";

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
		description: "`eslint` is installed",
		async detector({ folderInfo }) {
			return "eslint" in folderInfo.allDependencies;
		},
	},
	{
		description: "`.eslintrc.cjs` exists",
		async detector({ readFile }) {
			const eslintrc = await readFile({ path: ".eslintrc.cjs" });

			return eslintrc.exists;
		},
	},
];
