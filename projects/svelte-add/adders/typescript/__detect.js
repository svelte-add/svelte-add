/** @type {import("../..").Heuristic[]} */
export const heuristics = [
	{
		description: "`typescript` is installed",
		async detector({ environment }) {
			return "typescript" in environment.dependencies || "typescript" in environment.devDependencies;
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
