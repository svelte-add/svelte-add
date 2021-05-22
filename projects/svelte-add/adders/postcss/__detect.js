/** @type {import("../..").Heuristic[]} */
export const heuristics = [
	{
		description: "`postcss` is installed",
		async detector({ environment }) {
			return "postcss" in environment.dependencies || "postcss" in environment.devDependencies;
		},
	},
	{
		description: "`postcss-load-config` is installed",
		async detector({ environment }) {
			return "postcss-load-config" in environment.dependencies || "postcss-load-config" in environment.devDependencies;
		},
	},
	{
		description: "`svelte-preprocess` reads PostCSS config implicitly in `svelte.config.js`",
		async detector({ readFile }) {
			const js = await readFile({ path: "/svelte.config.js" });
			const cjs = await readFile({ path: "/svelte.config.cjs" });
			
			/** @param {string} text */
			const preprocessIsProbablySetup = (text) => {
				if (!text.includes("svelte-preprocess")) return false;
				if (!text.includes("preprocess:")) return false;
				if (!text.includes("postcss: true")) return false;

				return true;
			};

			if (js.existed) {
				return preprocessIsProbablySetup(js.text);
			} else if (cjs.existed) {
				return preprocessIsProbablySetup(cjs.text);
			}

			return false;
		},
	},
	{
		description: "`postcss.config.cjs` exists and `postcss.config.js` does not exist",
		async detector({ readFile }) {
			const cjs = await readFile({ path: "/postcss.config.cjs" });
			const js = await readFile({ path: "/postcss.config.js" });

			return cjs.existed && !js.existed;
		},
	},
];
