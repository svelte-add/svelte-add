/** @type {import("../..").Heuristic[]} */
export const heuristics = [
	{
		description: "`typescript` is installed",
		async detector({ folderInfo }) {
			return "typescript" in folderInfo.dependencies || "typescript" in folderInfo.devDependencies;
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
