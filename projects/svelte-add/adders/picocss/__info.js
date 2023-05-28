import { extension } from "../scss/stuff.js";

export const name = "PicoCSS";

export const emoji = "🔬";

export const usageMarkdown = ["You can use Pico CSS classes like `container` or `grid` in the markup (components, routes, `app.html`).", "You can [customize your Pico CSS theme with variables](https://picocss.com/docs/customization.html) like `$primary` in `src/variables.scss`."];

/** @type {import("../..").Gatekeep} */
export const gatekeep = async () => {
	return { able: true };
};

/** @typedef {{}} Options */

/** @type {import("../..").AdderOptions<Options>} */
export const options = {};

/** @type {import("../..").Heuristic[]} */
export const heuristics = [
	{
		description: "`picocss` is installed",
		async detector({ folderInfo }) {
			return "@picocss/pico" in folderInfo.allDependencies;
		},
	},
	{
		description: `some \`picocss\` files are imported in \`src/app.${extension}\``,
		async detector({ readFile }) {
			const { text } = await readFile({ path: `/src/app.${extension}` });
			return text.includes("picocss");
		},
	},
];
