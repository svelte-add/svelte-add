/**
 * @type {import("../..").Heuristic[]}
 */
export const heuristics = [
	{
		description: "`firebase-tools` is installed",
		async detector({ environment }) {
			return "firebase-tools" in environment.dependencies || "firebase-tools" in environment.devDependencies;
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
