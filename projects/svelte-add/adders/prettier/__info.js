export const name = "Prettier";

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
		description: "`prettier` is installed",
		async detector({ folderInfo }) {
			return "prettier" in folderInfo.allDependencies;
		},
	},
	{
		description: "`.prettierrc` exists",
		async detector({ readFile }) {
			const prettierrc = await readFile({ path: "/.prettierrc" });

			return prettierrc.exists;
		},
	},
];
