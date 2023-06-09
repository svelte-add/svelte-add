export const name = "(out of date) Firebase Hosting";

export const emoji = "🔥";

export const usageMarkdown = ["[You _cannot_ use server-side rendering](https://github.com/svelte-add/firebase-hosting/issues/1). Your site must be static. This means that, among other things, [`svelte-add/graphql-server`](https://github.com/svelte-add/graphql-server) is currently not suitable to be hosted on Firebase.", "Consider setting up GitHub Actions for automatic building and deployment to Firebase.\n\n  Start by generating [a CI login token from Firebase](https://firebase.google.com/docs/cli#cli-ci-systems):\n\n  ```sh\n  npm run firebase login:ci\n  ```\n\n  Then, go to your repository's [Settings > Secrets](https://docs.github.com/en/free-pro-team@latest/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository). Copy the result of the command above and [save it as a Secret](https://docs.github.com/en/free-pro-team@latest/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository) named `FIREBASE_TOKEN`.\n\n  You can test if it's working by making a commit to `main` or `master` and checking the Actions tab of your repository to see if your project successfully builds and deploys to Firebase.", "You can create a custom 404 page at `src/routes/404.svelte`.", "You can use the `deploy` package script to manually deploy the site after a `build`."];

/** @type {import("../..").Gatekeep} */
export const gatekeep = async () => {
	return { advice: "Out-of-date" };
};

/** @typedef {{ project: string }} Options */

/** @type {import("../..").AdderOptions<Options>} */
export const options = {
	project: {
		context: "You can find it at https://console.firebase.google.com/",
		default: "",
		descriptionMarkdown: "ignore this - it doesn't get used yet",
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
