export const name = "(out of date) GraphQL server";

export const emoji = "🕸";

export const usageMarkdown = ["You can create a GraphQL schema in `src/graphql/schema.ts` using any library or technique you want. Additionally, you can set the `defaultQuery` that shows up when GraphiQL is loaded in the browser.", "You can query your API (with POST requests) at the /graphql endpoint.", "You can visit GraphiQL in the browser at the /graphql endpoint.", "You can see an example of how you may set up resolver-level authorization with the `contextFactory` line in `src/routes/graphql.ts` and the `authorization` argument in `src/graphql/schema.ts`.", "The `/` page (in your `src/routes/index.svelte` file) will show an example of how to use your GraphQL API in `load`.", "You [_cannot_ use GraphQL subscriptions](https://github.com/svelte-add/graphql/issues/1)."];

/** @type {import("../..").Gatekeep} */
export const gatekeep = async ({ folderInfo }) => {
	if (!folderInfo.kit) return { advice: "can only be selected when using SvelteKit" };

	return { advice: "Out-of-date" };
};

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
