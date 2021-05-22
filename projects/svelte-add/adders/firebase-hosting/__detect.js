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
			const { existed } = await readFile({ path: "/firebase.json" });
			return existed;
		},
	},
	{
		description: "`.firebaserc` exists",
		async detector({ readFile }) {
			const { existed } = await readFile({ path: "/.firebaserc" });
			return existed;
		},
	},
];
