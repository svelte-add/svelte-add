/** @type {import("../..").Heuristic[]} */
export const heuristics = [
	{
		description: "`eslint` is installed",
		async detector({ environment }) {
			return "eslint" in environment.dependencies || "eslint" in environment.devDependencies;
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
