import mri from "mri";

/**
 * @typedef {"javascript" | "typescript" | "coffeescript"} Script
 */

/**
 * @typedef {"css" | "postcss" | "scss"} StyleLanguage
 */

/**
 * @typedef {"bulma" | "tailwindcss"} StyleFramework
 */

/**
 * @typedef {"graphql-server" | "mdsvex"} Other
 */

/**
 * @typedef {"prettier" | "eslint"} Quality
 */

/**
 * @typedef {"firebase-hosting"} Deploy
 */

/**
 * @typedef {"demos-yes" | "demos-no"} Demos
 */

/**
 * @typedef {Object} Choices
 * @property {Script} script
 * @property {StyleLanguage} styleLanguage
 * @property {StyleFramework?} styleFramework
 * @property {Other[]} other
 * @property {Quality[]} quality
 * @property {Deploy?} deploy
 * @property {Demos} demos
 */

/**
 * @type {{
 * 		script: [Script, never[]][]
 * 		style: [StyleLanguage, StyleFramework[]][]
 * 		other: [Other, never[]][]
 * 		deploy: [Deploy, never[]][]
 * 		demos: [Demos, never[]][]
 * }}
 */
const menu = {
	script: [
		["javascript", []],
		["typescript", []],
		["coffeescript", []],
	],
	style: [
		["css", []],
		["postcss", ["tailwindcss"]],
		["scss", ["bulma"]],
	],
	other: [
		["graphql-server", []],
		["mdsvex", []],
	],
	deploy: [
		["firebase-hosting", []],
	],
	demos: [
		["demos-yes", []],
		["demos-no", []],
	],
};

/**
 * Parses the given arguments and prompts for missing selections
 * @param {object} param0
 * @param {string[]} param0.args
 * @returns {Promise<Choices>}
 */
export const getChoices = async ({ args }) => {
	const passed = mri(args, {
		alias: {
			"add": "adders",
			"adder": "adders",
			"using": "adders",
		}
	});

	const adders = passed.adders?.split("+") ?? [];

	// TODO
	console.log({ adders, passed });
	return {
		script: "javascript",
		styleLanguage: "css",
		styleFramework: null,
		other: [],
		quality: [],
		deploy: null,
		demos: "demos-yes",
	}
};
