/** @type {import("../..").Heuristic[]} */
export const heuristics = [
	{
		description: "`mdsvex` is installed",
		async detector({ environment }) {
			return "mdsvex" in environment.dependencies || "mdsvex" in environment.devDependencies;
		},
	},
	{
		description: "`mdsvex` is set up as a preprocessor in `svelte.config.js`",
		async detector({ readFile }) {
			const js = await readFile({ path: "/svelte.config.js" });
			const cjs = await readFile({ path: "/svelte.config.cjs" });
			
			/** @param {string} text */
			const preprocessIsProbablySetup = (text) => {
				if (!text.includes("mdsvex")) return false;
				if (!text.includes("preprocess:")) return false;
				if (!text.includes("mdsvex(mdsvexConfig)")) return false;

				return true;
			};

			if (js.exists) {
				return preprocessIsProbablySetup(js.text);
			} else if (cjs.exists) {
				return preprocessIsProbablySetup(cjs.text);
			}

			return false;
		},
	},
	{
		description: "`mdsvex.config.cjs` or `mdsvex.config.js` exists",
		async detector({ readFile }) {
			const cjs = await readFile({ path: "/mdsvex.config.cjs" });
			const js = await readFile({ path: "/mdsvex.config.js" });

			return cjs.exists || js.exists;
		},
	},
];
