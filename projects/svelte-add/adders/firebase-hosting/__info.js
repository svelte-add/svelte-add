export const name = "(out of date) Firebase Hosting";

/** @type {import("../..").Gatekeep} */
export const gatekeep = async () => {
	return { able: true };
};

/** @typedef {{ project: string }} Options */

/** @type {import("../..").AdderOptions<Options>} */
export const options = {
	project: {
		context: "You can find it at https://console.firebase.google.com/",
		default: "",
		question: "(ignore this - it doesn't get used yet) What is your Firebase project's ID?",
	},
};

/** @type {import("../..").Heuristic[]} */
export const heuristics = [
	{
		description: "`firebase-tools` is installed",
		async detector({ folderInfo }) {
			return "firebase-tools" in folderInfo.allDependencies;
		},
	},
	{
		description: "`firebase.json` exists",
		async detector({ readFile }) {
			const { exists } = await readFile({ path: "/firebase.json" });
			return exists;
		},
	},
	{
		description: "`.firebaserc` exists",
		async detector({ readFile }) {
			const { exists } = await readFile({ path: "/.firebaserc" });
			return exists;
		},
	},
];
