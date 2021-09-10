/** @type {import("../..").Heuristic[]} */
export const heuristics = [
	{
		description: "`bulma` is installed",
		async detector({ folderInfo }) {
			return "bulma" in folderInfo.dependencies || "bulma" in folderInfo.devDependencies;
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

			if (app.exists) {
				return bulmaIsProbablyImported(app.text);
			} else if (global.exists) {
				return bulmaIsProbablyImported(global.text);
			}

			return false;
		},
	},
];
