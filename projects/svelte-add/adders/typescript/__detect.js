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
