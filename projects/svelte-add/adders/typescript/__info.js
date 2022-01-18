export const name = "TypeScript";

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
		description: "`typescript` is installed",
		async detector({ folderInfo }) {
			return "typescript" in folderInfo.allDependencies;
		},
	},
	{
		description: "`tsconfig.json` exists",
		async detector({ readFile }) {
			const tsconfig = await readFile({ path: "/tsconfig.json" });

			return tsconfig.exists;
		},
	},
];
