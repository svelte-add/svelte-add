/**
 * @type {import("../../index.js").Heuristic[]}
 */
export const heuristics = [
	{
		description: "`postcss` is installed",
		async detector({ dependencies, devDependencies }) {
			return "postcss" in dependencies || "postcss" in devDependencies;
		},
	},
	{
		description: "`postcss-load-config` is installed",
		async detector({ dependencies, devDependencies }) {
			return "postcss-load-config" in dependencies || "postcss-load-config" in devDependencies;
		},
	},
	{
		description: "`svelte-preprocess` reads PostCSS config implicitly in `svelte.config.js`",
		async detector({ readFile }) {
			const js = await readFile({ path: "/svelte.config.js" });
			const cjs = await readFile({ path: "/svelte.config.cjs" });
			
			/** @param {string} text */
			const preprocessSetup = (text) => {
				if (!text.includes("svelte-preprocess")) return false;
				if (!text.includes("postcss: true")) return false;

				return true;
			};

			if (js.existed) {
				return preprocessSetup(js.text);
			} else if (cjs.existed) {
				return preprocessSetup(cjs.text);
			} else {
				return false;
			}
		},
	},
	{
		description: "`postcss.config.cjs` exists",
		async detector({ readFile }) {
			const { existed } = await readFile({ path: "/postcss.config.cjs" });
			return existed;
		},
	},
	{
		description: "`postcss.config.js` does not exist",
		async detector({ readFile }) {
			const { existed } = await readFile({ path: "/postcss.config.js" });
			return !existed;
		},
	},
];
