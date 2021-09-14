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
