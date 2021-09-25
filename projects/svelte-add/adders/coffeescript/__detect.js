/** @type {import("../..").Heuristic[]} */
export const heuristics = [
	{
		description: "`coffeescript` is installed",
		async detector({ folderInfo }) {
			return "coffeescript" in folderInfo.allDependencies;
		},
	},
	{
		description: "`svelte-preprocess` is set up for CoffeeScript in `svelte.config.js`",
		async detector({ readFile }) {
			/** @param {string} text */
			const sveltePreprocessIsProbablySetup = (text) => {
				if (!text.includes("svelte-preprocess")) return false;
				return true;
			};

			const js = await readFile({ path: "/svelte.config.js" });
			const cjs = await readFile({ path: "/svelte.config.cjs" });

			if (js.exists) return sveltePreprocessIsProbablySetup(js.text);
			else if (cjs.exists) return sveltePreprocessIsProbablySetup(cjs.text);

			return false;
		},
	},
	{
		description: "The Vite CoffeeScript plugin set up",
		async detector({ readFile }) {
			/** @param {string} text */
			const vitePluginIsProbablySetup = (text) => {
				if (!text.includes("vite-plugin-coffee")) return false;
				if (!text.includes("coffee(")) return false;

				return true;
			};

			const js = await readFile({ path: "/svelte.config.js" });
			const cjs = await readFile({ path: "/svelte.config.cjs" });
			const vite = await readFile({ path: "/vite.config.js" });

			if (vitePluginIsProbablySetup(js.text)) return true;
			if (vitePluginIsProbablySetup(cjs.text)) return true;
			if (vitePluginIsProbablySetup(vite.text)) return true;

			return false;
		},
	},
];
