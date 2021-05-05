import { readdir, readFile as fsReadFile } from "fs/promises";
import { resolve } from "path";
import mri from "mri";

/**
 * @typedef {"javascript" | "typescript" | "coffeescript"} Script
 * @typedef {"css" | "postcss" | "scss"} StyleLanguage
 * @typedef {"bulma" | "tailwindcss"} StyleFramework
 * @typedef {"graphql-server" | "mdsvex"} Other
 * @typedef {"eslint" | "jest" | "prettier"} Quality
 * @typedef {"firebase-hosting"} Deploy
 * @typedef {"demos-yes" | "demos-no"} Demos
 */

/**
 * @typedef {Object} Choices
 * @property {Script} script
 * @property {StyleLanguage} styleLanguage
 * @property {StyleFramework | undefined} styleFramework
 * @property {Other[]} other
 * @property {Quality[]} quality
 * @property {Deploy | undefined} deploy
 * @property {Demos} demos
 */

/**
 * @type {{
 * 		script: [Script, never[]][]
 * 		style: [StyleLanguage, StyleFramework[]][]
 * 		other: [Other, never[]][]
 * 		quality: [Quality, never[]][]
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
	quality: [
		["eslint", []],
		["jest", []],
		["prettier", []],
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
 * @param {boolean} param0.promptMissing
 * @returns {Promise<Choices>}
 */
export const getChoices = async ({ args, promptMissing }) => {
	const passed = mri(args, {
		alias: {
			"add": "adders",
			"adder": "adders",
			"using": "adders",
			"with": "adders",
		}
	});

	const adders = passed.adders?.split("+") ?? [];

	// TODO
	console.log({ adders, passed });
	return {
		script: "javascript",
		styleLanguage: "css",
		styleFramework: undefined,
		other: [],
		quality: [],
		deploy: undefined,
		demos: "demos-yes",
	}
};

/**
 * @typedef {"vite" | "rollup" | "snowpack"| "webpack"} Bundler 
 */

/**
 * @typedef {Object} Environment
 * @property {boolean} empty
 * @property {Bundler | undefined} bundler
 * @property {boolean} kit
 */

/**
 * @param {object} param0
 * @param {string} param0.cwd
 * @returns {Promise<Environment>}
 */
export const getEnvironment = async ({ cwd }) => {
	const files = await readdir(cwd);

	if (files.length === 0) {
		return {
			bundler: undefined,
			empty: true,
			kit: false,
		}
	}

	const packageJson = await readFile({
		path: resolve(cwd, "package.json"),
	});

	const pkg = JSON.parse(packageJson.text || "{}");

	const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };

	/** @type {Bundler | undefined} */
	let bundler;
	if ("vite" in dependencies) {
		bundler = "vite";
	} else if ("rollup" in dependencies) {
		bundler = "rollup";
	} else if ("snowpack" in dependencies) {
		bundler = "snowpack";
	} else if ("webpack" in dependencies) {
		bundler = "webpack";
	}

	const kit = "@sveltejs/kit" in dependencies;

	return {
		bundler,
		empty: false,
		kit,
	};
};



/**
 * @param {object} param0
 * @param {string} param0.path
 * @returns Promise<{ existed: boolean, text: string }>
 */
export const readFile = async ({ path }) => {
    let existed = false;
    let text = "";

    try {
        text = await fsReadFile(path, {
            encoding: "utf-8",
        });

        existed = true;
    } catch (e) {
        // TODO: detect if ENOENT
        console.error(e);
	}
	
	return {
		existed,
		text,
	}
};

/**
 * @typedef {Object} DetectorArg
 * @property {any} dependencies
 * @property {any} devDependencies
 * @property {typeof readFile} readFile
 */

/**
 * @callback Detector
 * @param {DetectorArg} param0
 * @returns {Promise<boolean>}
 */

/**
 * @typedef {Object} Heuristic
 * @property {string} description - The message to display to explain
 * @property {Detector} detector
 */
