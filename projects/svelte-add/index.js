import { exec, spawn } from "child_process";
import { readdir, readFile as fsReadFile } from "fs/promises";
import { join } from "path";
import { inspect, promisify } from "util";
import { packageVersions } from "./package-versions.js";
import { updateCss, updateFile, updateJavaScript, updateJson, updateSvelte } from "./update.js";

/**
 * @typedef {"javascript" | "typescript" | "coffeescript"} Script
 * @typedef {"css" | "postcss" | "sass" | "scss"} StyleLanguage
 * @typedef {"bootstrap" | "bulma" | "tailwindcss"} StyleFramework
 * @typedef {"graphql-server" | "imagetools" | "mdsvex"} Other
 * @typedef {"eslint" | "jest" | "prettier"} Quality
 * @typedef {"firebase-hosting"} Deploy
 * @typedef {Deploy | "deploy-manual"} DeployMenuItem
 * @typedef {"demos-yes" | "demos-no"} DemosMenuItem
 */

/**
 * @typedef {Object} Choices
 * @property {string[]} presets
 * @property {Script} script
 * @property {StyleLanguage} styleLanguage
 * @property {StyleFramework | undefined} styleFramework
 * @property {Other[]} other
 * @property {Quality[]} quality
 * @property {Deploy | undefined} deploy
 * @property {boolean} demos
 * @property {Record<string, Record<string, any>>} adderOptions
 * @property {NPX} npx
 * @property {PackageManager} packageManager
 * @property {boolean} install
 */

/**
 * @type {{
 * 		script: [Script, []][]
 * 		style: [StyleLanguage, StyleFramework[]][]
 * 		other: [Other, []][]
 * 		quality: [Quality, []][]
 * 		deploy: [DeployMenuItem, []][]
 * 		demos: [DemosMenuItem, []][]
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
		["sass", []],
		["scss", ["bootstrap", "bulma"]],
	],
	other: [
		["graphql-server", []],
		["imagetools", []],
		["mdsvex", []],
	],
	quality: [
		["eslint", []],
		["jest", []],
		["prettier", []],
	],
	deploy: [
		["firebase-hosting", []],
		["deploy-manual", []],
	],
	demos: [
		["demos-yes", []],
		["demos-no", []],
	],
};

const scriptsAvailable = menu.script.map(([script]) => script);
const styleLanguagesAvailable = menu.style.map(([styleLanguage]) => styleLanguage);

/** @type {Record<StyleFramework, StyleLanguage>} */
// prettier-ignore
const styleFrameworksToLanguage = (Object.fromEntries(menu.style.flatMap(([styleLanguage, styleFrameworks]) => styleFrameworks.map((styleFramework) => [styleFramework, styleLanguage]))));

const othersAvailable = menu.other.map(([other]) => other);
const qualitiesAvailable = menu.quality.map(([quality]) => quality);
const deploysAvailable = menu.deploy.map(([deploy]) => deploy);

/**
 * Sorts out the given adders into categories (or prompts for them if needed)
 * @param {object} param0
 * @param {string[]} param0.addersAndPresets
 * @param {Environment} param0.environment
 * @param {boolean} param0.install
 * @param {Record<string, any>} param0.parsedArgs
 * @returns {Promise<Choices>}
 */
export const getChoices = async ({ addersAndPresets, environment, install, parsedArgs }) => {
	/** @type {Script} */
	let script;

	const scriptsPassed = scriptsAvailable.filter((script) => addersAndPresets.includes(script));

	if (scriptsPassed.length === 0) script = "javascript";
	else if (scriptsPassed.length === 1) script = scriptsPassed[0];
	else throw new Error(`too many script languages specified: ${inspect(scriptsPassed)}`);

	/** @type {StyleFramework | undefined} */
	let styleFramework;

	/** @type {StyleFramework[]} */
	// prettier-ignore
	const styleFrameworksPassed = (Object.keys(styleFrameworksToLanguage).filter((styleFramework) => addersAndPresets.includes(styleFramework)));
	if (styleFrameworksPassed.length === 0) styleFramework = undefined;
	else if (styleFrameworksPassed.length === 1) styleFramework = styleFrameworksPassed[0];
	else throw new Error(`too many style frameworks specified: ${inspect(styleFrameworksPassed)}`);

	/** @type {StyleLanguage} */
	let styleLanguage;

	const styleLanguagesPassed = styleLanguagesAvailable.filter((styleLanguage) => addersAndPresets.includes(styleLanguage));
	if (styleLanguagesPassed.length === 0) {
		if (styleFramework) styleLanguage = styleFrameworksToLanguage[styleFramework];
		else styleLanguage = "css";
	} else if (styleLanguagesPassed.length === 1) {
		if (styleFramework) {
			styleLanguage = styleFrameworksToLanguage[styleFramework];
			if (styleLanguagesPassed[0] !== styleLanguage) throw new Error(`wrong style language passed (expected ${styleLanguage} because ${styleFramework} was selected as a framework) but was given ${styleFrameworksPassed[0]}`);
		} else styleLanguage = styleLanguagesPassed[0];
	} else throw new Error(`too many style languages specified: ${inspect(styleLanguagesPassed)}`);

	// TODO: add option for this
	/** @type {PackageManager} */
	let packageManager = "npm";
	if (environment.packageManagers.pnpm) packageManager = "pnpm";
	else if (environment.packageManagers.yarn) packageManager = "yarn";

	/** @type {NPX} */
	let npx = "npx";
	if (environment.npxs.pnpx) npx = "pnpx";

	const other = othersAvailable.filter((other) => addersAndPresets.includes(other));
	const quality = qualitiesAvailable.filter((other) => addersAndPresets.includes(other));

	/** @type {Deploy | undefined} */
	let deploy;

	const deploysPassed = deploysAvailable.filter((deploy) => addersAndPresets.includes(deploy));

	if (deploysPassed.length === 0) deploy = undefined;
	else if (deploysPassed.length === 1) {
		if (deploysPassed[0] === "deploy-manual") deploy = undefined;
		else deploy = deploysPassed[0];
	} else throw new Error(`too many deployment targets specified: ${inspect(deploysPassed)}`);

	// TODO: add option / flag for this
	const demos = false;

	// Options parsing

	const parsedArgsCopy = { ...parsedArgs };

	// Shorthand so that npx svelte-add tailwindcss --jit
	// is interpreted the same as npx svelte-add tailwindcss --tailwindcss-jit
	// (since that's just redundant)
	if (addersAndPresets.length === 1) {
		const adderPrefix = `${addersAndPresets[0]}-`;
		for (const [arg, value] of Object.entries(parsedArgsCopy)) {
			if (arg.startsWith(adderPrefix)) continue;
			parsedArgsCopy[`${adderPrefix}${arg}`] = value;
			delete parsedArgsCopy[arg];
		}
	}

	/** @type {Record<string, Record<string, any>>} */
	const adderOptions = {};
	for (const adder of addersAndPresets) {
		/** @type {AdderOptions<any>} */
		let options;
		try {
			({ options } = await getAdderMetadata({ adder }));
		} catch (e) {
			if (e.code === "ERR_MODULE_NOT_FOUND") continue;
			else throw e;
		}
		const defaults = Object.fromEntries(Object.entries(options).map(([option, data]) => [option, data.default]));

		adderOptions[adder] = { ...defaults };

		const adderPrefix = `${adder}-`;
		for (const [arg, value] of Object.entries(parsedArgsCopy)) {
			if (!arg.startsWith(adderPrefix)) {
				if (arg in defaults) throw new Error(`TODO: why is this an error?`);
				continue;
			}

			const option = arg.slice(adderPrefix.length);

			if (!(option in defaults)) throw new Error(`${inspect(option)} is not a valid option for the ${adder} adder: ${Object.keys(defaults).length === 0 ? "it doesn't accept any options." : `it accepts ${inspect(Object.keys(defaults))} as options.`}`);

			if (typeof defaults[option] === "boolean") {
				if (value === "true" || value === true) adderOptions[adder][option] = true;
				else if (value === "false" || value === false) adderOptions[adder][option] = false;
				else throw new Error(`${inspect(value)} is not a valid value for the ${adder} adder's ${inspect(option)} option because it needs to be a boolean (true or false)`);
			} else if (typeof defaults[option] === "string") {
				adderOptions[adder][option] = value;
			} else {
				throw new Error(`svelte-add currently doesn't support non-boolean-non-string arguments: the ${adder} adder expected a ${typeof defaults[option]} for the ${inspect(option)} option\nThis is definitely not supposed to happen, so please create or find an existing issue at "https://github.com/svelte-add/svelte-add/issues" with the full command output.`);
			}

			delete parsedArgsCopy[`${adderPrefix}${option}`];
		}
	}

	const remainingArgs = Object.keys(parsedArgsCopy);
	if (remainingArgs.length !== 0) throw new Error(`${inspect(parsedArgsCopy)} were passed as arguments but none of the adders specified (${inspect(addersAndPresets)}), nor svelte-add itself, expected them, so they won't be used. Try running the command again without them.`);

	return {
		presets: addersAndPresets.filter((adderOrPreset) => adderOrPreset.includes("/")),
		script,
		styleLanguage,
		styleFramework,
		other,
		quality,
		deploy,
		demos,
		adderOptions,
		packageManager,
		npx,
		install,
	};
};

export const packageManagers = {
	npm: {
		command: {
			win32: "npm.cmd",
		},
		detect: "--version",
		install: "install",
	},
	pnpm: {
		command: {
			win32: "pnpm.cmd",
		},
		detect: "--version",
		install: "install",
	},
	yarn: {
		command: {
			win32: "yarn.cmd",
		},
		detect: "--version",
		install: "install",
	},
};

const npxs = {
	npx: {
		command: {
			win32: "npx.cmd",
		},
		detect: "--version",
	},
	pnpx: {
		command: {
			win32: "pnpx.cmd",
		},
		detect: "--version",
	},
};

/**
 * @param {object} param0
 * @param {NPX} param0.npx
 * @param {NodeJS.Platform} param0.platform
 * @returns {string}
 */
export const getNpxCommand = ({ npx, platform }) => {
	/** @type {string} */
	let packageManagerCommand = npx;
	if (platform in npxs[npx].command) {
		/** @type {keyof typeof npxs[npx]["command"]} */
		// prettier-ignore
		const platformTypeSafe = (platform);
		packageManagerCommand = npxs[npx].command[platformTypeSafe];
	}
	return packageManagerCommand;
};

/**
 * @typedef {typeof packageManagers} PackageManagers
 * @typedef {keyof PackageManagers} PackageManager
 
 * @typedef {typeof npxs} NPXs
 * @typedef {keyof NPXs} NPX
 * 
 * @typedef {NPXs | PackageManagers} Tools
 * @typedef {NPX | PackageManager} Tool
 */

/**
 * @template {NPXs | PackageManagers} ToolsType
 * @param {object} param0
 * @param {keyof ToolsType} param0.tool
 * @param {ToolsType} param0.tools
 * @param {NodeJS.Platform} param0.platform
 * @returns {string}
 */
export const getToolCommand = ({ platform, tool, tools }) => {
	/** @type {string} */
	// prettier-ignore
	let packageManagerCommand = (tool);
	/** @type {any} */
	const toolData = tools[tool];
	if (platform in toolData.command) {
		packageManagerCommand = toolData.command[platform];
	}
	return packageManagerCommand;
};

/**
 * @template {NPXs | PackageManagers} ToolsType
 * @param {object} param0
 * @param {NodeJS.Platform} param0.platform
 * @param {ToolsType} param0.tools
 * @returns {Promise<Record<Tool, boolean>>}
 */
const getAvailable = async ({ platform, tools }) =>
	Object.fromEntries(
		await Promise.all(
			Object.keys(tools).map(async (tool) => {
				/** @type {keyof ToolsType} */
				// prettier-ignore
				const toolTypeSafe = (tool);
				const command = getToolCommand({ platform, tool: toolTypeSafe, tools });

				/** @type {any} */
				const toolData = tools[toolTypeSafe];
				/** @type {string} */
				const detect = toolData.detect;

				try {
					await promisify(exec)(`${command} ${detect}`);
				} catch {
					return [tool, false];
				}
				return [tool, true];
			})
		)
	);

/**
 * @typedef { "rollup" | "snowpack" | "vite" | "webpack"} Bundler
 *
 * @typedef {Object} Environment
 * @property {Bundler | undefined} bundler
 * @property {import("./package-versions").Dependencies} dependencies
 * @property {import("./package-versions").Dependencies} devDependencies
 * @property {boolean} empty
 * @property {boolean} kit
 * @property {Record<NPX, boolean>} npxs
 * @property {Record<PackageManager, boolean>} packageManagers
 * @property {"commonjs" | "module" | undefined} packageType
 * @property {NodeJS.Platform} platform
 *
 * @param {object} param0
 * @param {string} param0.cwd
 * @returns {Promise<Environment>}
 */
export const getEnvironment = async ({ cwd }) => {
	const platform = process.platform;

	const [npxsAvailable, packageManagersAvailable] = await Promise.all([getAvailable({ platform, tools: npxs }), getAvailable({ platform, tools: packageManagers })]);

	let files = [];
	try {
		files = await readdir(cwd);
	} catch (e) {
		if (e.code !== "ENOENT") throw e;
	}

	if (files.length === 0) {
		return {
			bundler: undefined,
			devDependencies: {},
			dependencies: {},
			empty: true,
			kit: false,
			npxs: npxsAvailable,
			packageManagers: packageManagersAvailable,
			packageType: undefined,
			platform,
		};
	}

	const packageJson = await readFile({
		path: join(cwd, "/package.json"),
	});

	const pkg = JSON.parse(packageJson.text || "{}");

	const packageType = pkg.type;

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
		npxs: npxsAvailable,
		packageManagers: packageManagersAvailable,
		packageType,
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
		text = (
			await fsReadFile(path, {
				encoding: "utf-8",
			})
		).toString();
	} catch (e) {
		exists = false;
		if (e.code !== "ENOENT") throw e;
	}

	return {
		exists,
		text,
	};
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

	return Object.fromEntries(
		await Promise.all(
			heuristics.map(async (heuristic) => [
				heuristic.description,
				await heuristic.detector({
					environment,
					readFile({ path }) {
						return readFile({ path: join(cwd, path) });
					},
				}),
			])
		)
	);
};

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
export const applyPreset = ({ args, cwd, npx, preset }) =>
	new Promise((resolve, reject) => {
		if (!args.includes("--no-ssh")) args = [...args, "--no-ssh"];

		const subprocess = spawn(npx, ["--yes", "--package", "use-preset", "apply", preset, ...args], {
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
 * @property {function({ prod?: boolean, package: keyof typeof packageVersions }): Promise<void>} install
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
 * @template NameToType
 * @typedef {{
 *   [name in keyof NameToType]: {
 *     default: NameToType[name];
 *     description: string;
 *   }
 * }} AdderOptions
 */

/**
 * @param {object} param0
 * @param {string} param0.adder
 * @returns {Promise<{ name: string, options: AdderOptions<any> }>}
 */
export const getAdderMetadata = async ({ adder }) => {
	return await import(`./adders/${adder}/__metadata.js`);
};

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
		async install({ prod = false, package: pkg }) {
			await updateJson({
				path: join(cwd, "/package.json"),
				async json({ obj }) {
					const version = packageVersions[pkg];

					if (prod) {
						if (!obj.dependencies) obj.dependencies = {};
						obj.dependencies[pkg] = version;
					} else {
						if (!obj.devDependencies) obj.devDependencies = {};
						obj.devDependencies[pkg] = version;
					}

					return {
						obj,
					};
				},
			});
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
};

/**
 * @param {object} param0
 * @param {string} param0.cwd
 * @param {string} param0.packageManagerCommand
 * @returns {Promise<void>}
 */
export const installDependencies = ({ cwd, packageManagerCommand }) =>
	new Promise((resolve, reject) => {
		// TODO: check the map and get install from there
		const subprocess = spawn(packageManagerCommand, ["install"], {
			cwd,
			stdio: "pipe",
			timeout: 90000,
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

			reject(new Error(body));
		});
	});
