/**
 * @type {import("../..").Heuristic[]}
 */
export const heuristics = [
	{
		description: "`firebase-tools` is installed",
		async detector({ folderInfo }) {
			return "firebase-tools" in folderInfo.dependencies || "firebase-tools" in folderInfo.devDependencies;
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
