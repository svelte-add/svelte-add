export const name = "JavaScript";

/** @type {import("../..").Gatekeep} */
export const gatekeep = async ({ folderInfo }) => {
	if (!folderInfo.empty)
		return {
			advice: "can only be selected when initializing an app",
		};

	return { able: true };
};

/** @typedef {{}} Options */

/** @type {import("../..").AdderOptions<Options>} */
export const options = {};

/** @type {import("../..").Heuristic[]} */
export const heuristics = [];
