/** @type {import("../..").Heuristic[]} */
export const heuristics = [
	{
		description: "`graphql` is installed",
		async detector({ folderInfo }) {
			return "graphql" in folderInfo.dependencies || "graphql" in folderInfo.devDependencies;
		},
	},
	{
		description: "`graphql-helix` is installed",
		async detector({ folderInfo }) {
			return "graphql-helix" in folderInfo.dependencies || "graphql-helix" in folderInfo.devDependencies;
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
