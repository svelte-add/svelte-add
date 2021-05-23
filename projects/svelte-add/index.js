import { exec, spawn } from "child_process";
import { readdir, readFile as fsReadFile } from "fs/promises";
import mri from "mri";
import { resolve } from "path";
import { join } from "path/posix";
import { promisify } from "util";

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

const packageManagerDetectors = {
	"npm": "npm --version",
	"pnpm": "pnpm --version",
	"yarn": "yarn --version", // TODO: is that right??
}

/**
 * @typedef {keyof typeof packageManagerDetectors} PackageManager
 * @typedef { "rollup" | "snowpack" | "vite" | "webpack"} Bundler 
 * 
 * @typedef {Object} Environment
 * @property {Bundler | undefined} bundler
 * @property {import("./package-versions").Dependencies} dependencies
 * @property {import("./package-versions").Dependencies} devDependencies
 * @property {boolean} empty
 * @property {Record<PackageManager, boolean>} packageManagers
 * @property {boolean} kit
 *
 * @param {object} param0
 * @param {string} param0.cwd
 * @returns {Promise<Environment>}
 */
export const getEnvironment = async ({ cwd }) => {
	const packageManagers = Object.fromEntries(await Promise.all(Object.entries(packageManagerDetectors).map(async ([name, command]) => {
		try {
			await promisify(exec)(command);
		} catch {
			return [name, false];
		}
		return [name, true];
	})));

	const files = await readdir(cwd);

	if (files.length === 0) {
		return {
			bundler: undefined,
			devDependencies: {},
			dependencies: {},
			empty: true,
			kit: false,
			packageManagers,
		}
	}

	const packageJson = await readFile({
		path: resolve(cwd, "package.json"),
	});

	const pkg = JSON.parse(packageJson.text || "{}");

	/** @type {import("./package-versions").Dependencies} */
	const dependencies = pkg.dependencies ?? {};
	/** @type {import("./package-versions").Dependencies} */
	const devDependencies = pkg.devDependencies ?? {};
	const allDependencies = { ...dependencies, ...devDependencies };

	/** @type {Bundler | undefined} */
	let bundler;

	// Vite is a dependency of SvelteKit now
	if ("@sveltejs/kit" in allDependencies) bundler = "vite";

	if ("vite" in allDependencies) {
		bundler = "vite";
	} else if ("rollup" in allDependencies) {
		bundler = "rollup";
	} else if ("snowpack" in allDependencies) {
		bundler = "snowpack";
	} else if ("webpack" in allDependencies) {
		bundler = "webpack";
	}

	const kit = "@sveltejs/kit" in allDependencies;

	return {
		bundler,
		dependencies,
		devDependencies,
		empty: false,
		kit,
		packageManagers,
	};
};



/**
 * @param {object} param0
 * @param {string} param0.path
 * @returns Promise<{ existed: boolean, text: string }>
 */
export const readFile = async ({ path }) => {
	let existed = true;
	let text = "";

	try {
		text = (await fsReadFile(path, {
			encoding: "utf-8",
		})).toString();
	} catch (e) {
		existed = false;
		if (e.code !== "ENOENT") throw e;
	}
	
	return {
		existed,
		text,
	}
};

/**
 * @typedef {Object} DetectorArg
 * @property {Environment} environment
 * @property {typeof readFile} readFile
 * 
 * @callback Detector
 * @param {DetectorArg} param0
 * @returns {Promise<boolean>}
 * 
 * @typedef {Object} Heuristic
 * @property {string} description - The message to display to explain
 * @property {Detector} detector
 */


/** 
 * @param {Object} param0
 * @param {string} param0.cwd
 * @param {Heuristic[]} param0.heuristics
 * @param {Environment} param0.environment
 * @returns {Promise<Record<Heuristic["description"], boolean>>}
 */
export const detect = async ({ cwd, environment, heuristics }) => Object.fromEntries(await Promise.all(heuristics.map(async (heuristic) =>
	[heuristic.description, await heuristic.detector({
		environment,
		readFile({ path }) {
			return readFile({ path: join(cwd, path) });
		}
	})]
)));

/**
 * @typedef {Object} ApplyPresetArg
 * @property {string[]} args
 * @property {string} cwd
 * @property {string} npx
 * @property {string} preset
 *
 * @param {ApplyPresetArg} param0
 * @return {Promise<void>}
 */
export const applyPreset = ({ args, cwd, npx, preset }) => new Promise((resolve, reject) => {
	if (!args.includes("--no-ssh")) args = [...args, "--no-ssh"];
	
	const subprocess = spawn(npx, ["--yes", "--ignore-existing", "apply", preset, ...args], {
		cwd,
		stdio: "pipe",
		timeout: 20000,
	});

	subprocess.on("close", (code) => {
		if (code === 0) resolve(undefined);

		reject(code);
	});
});

/** 
 * @template Options
 * @typedef {Object} AdderRunArg
 * @property {function(Omit<ApplyPresetArg, "cwd">): ReturnType<typeof applyPreset>} applyPreset
 * @property {Environment} environment
 * @property {Options} options
 */

/**
 * @template Options
 * @callback AdderRun
 * @param {AdderRunArg<Options>} param0
 * @returns {Promise<void>}
 */

/**
 * @template Options
 * @param {object} param0
 * @param {string} param0.adder
 * @param {string} param0.cwd
 * @param {Environment} param0.environment
 * @param {Options} param0.options
 * @return {Promise<void>}
 */
export const runAdder = async ({ adder, cwd, environment, options }) => {
	/** @type {{ run: AdderRun<Options> }} */
	const { run } = await import(`./adders/${adder}/__run.js`);

	await run({
		applyPreset({ ...args }) {
			return applyPreset({ ...args, cwd });
		},
		environment,
		options,
	});
}
