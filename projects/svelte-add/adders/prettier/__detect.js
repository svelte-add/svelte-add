/** @type {import("../..").Heuristic[]} */
export const heuristics = [
	{
		description: "`prettier` is installed",
		async detector({ environment }) {
			return "prettier" in environment.dependencies || "prettier" in environment.devDependencies;
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
