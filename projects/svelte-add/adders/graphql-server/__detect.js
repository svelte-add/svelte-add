/** @type {import("../..").Heuristic[]} */
export const heuristics = [
	{
		description: "`graphql` is installed",
		async detector({ environment }) {
			return "graphql" in environment.dependencies || "graphql" in environment.devDependencies;
		},
	},
	{
		description: "`graphql-helix` is installed",
		async detector({ environment }) {
			return "graphql-helix" in environment.dependencies || "graphql-helix" in environment.devDependencies;
		},
	},
	{
		description: "`src/routes/graphql.js` or `src/routes/graphql.ts` exists",
		async detector({ readFile }) {
			const js = await readFile({ path: "/src/routes/graphql.js" });
			const ts = await readFile({ path: "/src/routes/graphql.ts" });

			return js.exists || ts.exists;
		},
	},
];
