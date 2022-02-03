export const name = "(work in progress) Imagetools";

export const emoji = "🖼";

export const usageMarkdown = ["WIP"];

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
		description: "`vite-imagetools` is installed",
		async detector({ folderInfo }) {
			return "vite-imagetools" in folderInfo.allDependencies;
		},
	},
];
