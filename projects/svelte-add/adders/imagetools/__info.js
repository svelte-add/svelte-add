export const name = "(work in progress) Imagetools";

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
