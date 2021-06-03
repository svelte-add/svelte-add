import { exec, spawn } from "child_process";
import { readdir, readFile as fsReadFile } from "fs/promises";
import mri from "mri";
import { join, resolve } from "path";
import { inspect, promisify } from "util";
import { packageVersions } from "./package-versions.js";
import { updateCss, updateFile, updateJavaScript, updateJson, updateSvelte } from "./update.js";

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

const npxDetectors = {
	"npx": "npx --version",
	"pnpx": "pnpx --version",
}

/**
 * @typedef {keyof typeof packageManagerDetectors} PackageManager
 * @typedef {keyof typeof npxDetectors} NPX
 * @typedef { "rollup" | "snowpack" | "vite" | "webpack"} Bundler 
 * 
 * @typedef {Object} Environment
 * @property {Bundler | undefined} bundler
 * @property {import("./package-versions").Dependencies} dependencies
 * @property {import("./package-versions").Dependencies} devDependencies
 * @property {boolean} empty
 * @property {boolean} kit
 * @property {Record<NPX, boolean>} npx
 * @property {Record<PackageManager, boolean>} packageManagers
 * @property {typeof process.platform} platform
 *
 * @param {object} param0
 * @param {string} param0.cwd
 * @returns {Promise<Environment>}
 */
export const getEnvironment = async ({ cwd }) => {
	const platform = process.platform;

	/**
	 * @template {string} Tool
	 * @param {Record<Tool, string>} detectors
	 * @returns {Promise<Record<Tool, boolean>>}
	 */
	const getAvailable = async (detectors) => Object.fromEntries(await Promise.all(Object.entries(detectors).map(async ([name, command]) => {
		try {
			await promisify(exec)(command);
		} catch {
			return [name, false];
		}
		return [name, true];
	})));

	const [npx, packageManagers] = await Promise.all([getAvailable(npxDetectors), getAvailable(packageManagerDetectors)]);

	const files = await readdir(cwd);

	if (files.length === 0) {
		return {
			bundler: undefined,
			devDependencies: {},
			dependencies: {},
			empty: true,
			kit: false,
			npx,
			packageManagers,
			platform,
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
		npx,
		packageManagers,
		platform,
	};
};



/**
 * @param {object} param0
 * @param {string} param0.path
 * @returns {Promise<{ exists: boolean, text: string }>}
 */
export const readFile = async ({ path }) => {
	let exists = true;
	let text = "";

	try {
		text = (await fsReadFile(path, {
			encoding: "utf-8",
		})).toString();
	} catch (e) {
		exists = false;
		if (e.code !== "ENOENT") throw e;
	}
	
	return {
		exists,
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
 * @param {object} param0
 * @param {string} param0.adder
 * @param {string} param0.cwd
 * @param {Environment} param0.environment
 * @returns {Promise<Record<Heuristic["description"], boolean>>}
 */
export const detectAdder = async ({ adder, cwd, environment }) => {
	/** @type {{ heuristics: Heuristic[] }} */
	const { heuristics } = await import(`./adders/${adder}/__detect.js`);

	return Object.fromEntries(await Promise.all(heuristics.map(async (heuristic) =>
		[heuristic.description, await heuristic.detector({
			environment,
			readFile({ path }) {
				return readFile({ path: join(cwd, path) });
			}
		})]
	)));
}

/**
 * @typedef {Object} ApplyPresetArg
 * @property {string[]} args
 * @property {string} cwd
 * @property {string} npx
 * @property {string} preset
 *
 * @param {ApplyPresetArg} param0
 * @returns {Promise<void>}
 */
export const applyPreset = ({ args, cwd, npx, preset }) => new Promise((resolve, reject) => {
	if (!args.includes("--no-ssh")) args = [...args, "--no-ssh"];
	
	const subprocess = spawn(npx, ["--yes", "--ignore-existing", "apply", preset, ...args], {
		cwd,
		stdio: "pipe",
		timeout: 20000,
	});

	let body = "";

	subprocess.stderr.on("data", (chunk) => {
		body += chunk;
	});

	subprocess.stderr.on("end", () => {
		if (body === "") {
			resolve(undefined);
			return;
		}

		if (body.includes("remote: Repository not found.")) {
			reject(new Error(`The ${inspect(preset)} preset does not exist on GitHub. Have you spelled it correctly?`));
			return;
		}

		if (body.includes("[ error ]  Could not clone")) {
			reject(new Error(`The ${inspect(preset)} preset could not be cloned. Is git installed?`));
			return;	
		}

		reject(new Error(body));
	});
});

/** 
 * @template Options
 * @typedef {Object} AdderRunArg
 * @property {function(Omit<ApplyPresetArg, "cwd" | "npx">): ReturnType<typeof applyPreset>} applyPreset
 * @property {Environment} environment
 * @property {function({ dev: boolean, package: keyof typeof packageVersions }): Promise<void>} install
 * @property {Options} options
 * @property {typeof updateCss} updateCss
 * @property {typeof updateFile} updateFile
 * @property {typeof updateJavaScript} updateJavaScript
 * @property {typeof updateJson} updateJson
 * @property {typeof updateSvelte} updateSvelte
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
 * @param {string} param0.npx
 * @param {Options} param0.options
 * @returns {Promise<void>}
 */
export const runAdder = async ({ adder, cwd, environment, npx, options }) => {
	/** @type {{ run: AdderRun<Options> }} */
	const { run } = await import(`./adders/${adder}/__run.js`);

	await run({
		applyPreset({ ...args }) {
			return applyPreset({ ...args, cwd, npx });
		},
		environment,
		async install({ dev, package: pkg }) {
			await updateJson({
				path: join(cwd, "/package.json"),
				async json({ obj }) {
					const version = `^${packageVersions[pkg]}`;
					
					if (dev) {
						obj.devDependencies ??= {};
						obj.devDependencies[pkg] = version;
					} else {
						obj.dependencies ??= {};
						obj.dependencies[pkg] = version;
					}

					return {
						obj,
					};
				}
			})
		},
		options,
		updateCss({ path, ...args }) {
			return updateCss({ path: join(cwd, path), ...args });
		},
		updateFile({ path, ...args }) {
			return updateFile({ path: join(cwd, path), ...args });
		},
		updateJson({ path, ...args }) {
			return updateJson({ path: join(cwd, path), ...args });
		},
		updateJavaScript({ path, ...args }) {
			return updateJavaScript({ path: join(cwd, path), ...args });
		},
		updateSvelte({ path, ...args }) {
			return updateSvelte({ path: join(cwd, path), ...args });
		},
	});
}
