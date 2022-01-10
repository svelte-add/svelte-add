export const name = "(out of date) GraphQL server";

/** @typedef {{}} Options */

/** @type {import("../..").AdderOptions<Options>} */
export const options = {};

/** @type {import("../..").Heuristic[]} */
export const heuristics = [
	{
		description: "`graphql` is installed",
		async detector({ folderInfo }) {
			return "graphql" in folderInfo.allDependencies;
		},
	},
	{
		description: "`graphql-helix` is installed",
		async detector({ folderInfo }) {
			return "graphql-helix" in folderInfo.allDependencies;
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
