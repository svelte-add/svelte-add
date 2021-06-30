export const name = "Hosting on Firebase";

/** @typedef {{ project: string }} Options */

/** @type {import("../..").AdderOptions<Options>} */
export const options = {
	project: {
		description: "What is your Firebase project's ID, according to https://console.firebase.google.com/ ?",
		default: "",
	},
};
