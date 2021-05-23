/**
 * @type {import("../..").Heuristic[]}
 */
export const heuristics = [
	{
		description: "`bulma` is installed",
		async detector({ environment }) {
			return "bulma" in environment.dependencies || "bulma" in environment.devDependencies;
		},
	},
	{
		description: "some `bulma` files are imported in `src/app.scss`",
		async detector({ readFile }) {
			const app = await readFile({ path: "/src/app.scss" });
			const global = await readFile({ path: "/src/global.scss" });
			
			/** @param {string} text */
			const bulmaIsProbablyImported = (text) => {
				if (!text.includes("bulma")) return false;

				return true;
			};

			if (app.existed) {
				return bulmaIsProbablyImported(app.text);
			} else if (global.existed) {
				return bulmaIsProbablyImported(global.text);
			}

			return false;
		},
	},
];
