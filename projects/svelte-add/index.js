import { exec, spawn } from "child_process";
import { readdir, readFile as fsReadFile } from "fs/promises";
import colors from "kleur";
import { join, resolve } from "path";
import prompts from "prompts";
import { inspect, promisify } from "util";
import { packageVersions } from "./package-versions.js";
import { updateCss, updateFile, updateJavaScript, updateJson, updateSvelte } from "./update.js";

/** @param {string} text - The error message to display when exiting */
export const exit = (text) => {
	console.error(text);
	process.exit(1);
};

/**
 * @typedef {"coffeescript" | "javascript" | "typescript"} Script
 * @typedef {"css" | "postcss" | "scss"} StyleLanguage
 * @typedef {"bootstrap" | "bulma" | "tailwindcss"} StyleFramework
 * @typedef {"3d" | "graphql-server" | "mdsvex"} Other
 * @typedef {"eslint" | "prettier"} Quality
 * @typedef {"firebase-hosting" | "github-pages"} Deploy
 */

/** @type {Script[]} */
const scripts = ["javascript", "typescript", "coffeescript"];
/** @type {StyleLanguage[]} */
const styleLanguages = ["css", "postcss", "scss"];
/** @type {Other[]} */
const others = ["3d", "graphql-server", "mdsvex"];
/** @type {Quality[]} */
const qualities = ["eslint", "prettier"];
/** @type {Deploy[]} */
const deploys = ["firebase-hosting", "github-pages"];

/** @type {Record<StyleFramework, StyleLanguage>} */
const styleLanguageForFramework = {
	bootstrap: "scss",
	bulma: "scss",
	tailwindcss: "postcss",
};

const styleFrameworksForLanguage = /** @type {Record<StyleLanguage, StyleFramework[]>} */ ({});
for (const [framework, language] of Object.entries(styleLanguageForFramework)) {
	if (styleFrameworksForLanguage[language] === undefined) styleFrameworksForLanguage[language] = [];
	styleFrameworksForLanguage[language].push(/** @type {StyleFramework} */ (framework));
}

/**
 * @typedef {Object} Choices
 * @property {string} givenProjectDirectory
 * @property {string} projectDirectory
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
 *
 */

/**
 * Sorts out the given adders into categories (or prompts for them if needed)
 * @param {object} param0
 * @param {boolean} param0.defaultInstall
 * @param {Environment} param0.environment
 * @param {boolean} param0.outputFolderMustBe
 * @param {string[] | undefined} param0.passedFeatures
 * @param {Record<string, any>} param0.passedArgs
 * @param {string | boolean | undefined} param0.passedDemos
 * @param {string | boolean | undefined} param0.passedInstall
 * @param {readonly string[]} param0.passedOutput
 * @param {PackageManager | undefined} param0.passedPackageManager
 * @returns {Promise<Choices>}
 */
export const getChoices = async ({ defaultInstall, environment, outputFolderMustBe, passedFeatures, passedArgs, passedDemos, passedInstall, passedOutput, passedPackageManager }) => {
	const interactive = passedFeatures === undefined && Object.keys(passedArgs).length === 0 && passedInstall === undefined && passedOutput.length === 0;

	if (passedOutput.length > 1) exit("TODO: explain this error.");

	/** @type {string} */
	let givenProjectDirectory;
	/** @type {string} */
	let projectDirectory;

	/** @type {Script} */
	let script;
	/** @type {StyleFramework | undefined} */
	let styleFramework;
	/** @type {StyleLanguage} */
	let styleLanguage;
	/** @type {Other[]} */
	let other;
	/** @type {Quality[]} */
	let quality;
	/** @type {Deploy | undefined} */
	let deploy;

	/** @type {Record<string, Record<string, any>>} */
	const adderOptions = {};

	/** @type {string[]} */
	let presets;

	/** @type {boolean} */
	let demos;

	/** @type {PackageManager} */
	let defaultPackageManager = "npm";
	if (environment.packageManagers.pnpm) defaultPackageManager = "pnpm";
	else if (environment.packageManagers.yarn) defaultPackageManager = "yarn";
	/** @type {PackageManager} */
	let packageManager;

	/** @type {NPX} */
	let defaultNpx = "npx";
	if (environment.npxs.pnpx) defaultNpx = "pnpx";
	/** @type {NPX} */
	let npx;

	/** @type {boolean} */
	let install;

	if (!interactive) {
		givenProjectDirectory = passedOutput[0];
		projectDirectory = resolve(process.cwd(), givenProjectDirectory);

		const folderInfo = await getFolderInfo({ projectDirectory });
		if (!folderInfo.empty && !outputFolderMustBe) exit(`${colors.red(`${inspect(passedOutput[0])} isn't an empty directory, so the app initializer shouldn't run.`)}\nCreate or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} if this is wrong.`);
		else if (outputFolderMustBe) {
			if (folderInfo.empty) exit(`${colors.red("There is no valid Svelte project in this directory because it's empty, so svelte-add cannot run.")}\nCreate or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} if this is wrong.`);
			if (folderInfo.bundler === undefined) exit(`${colors.red("There is no valid Svelte project in this directory because there doesn't seem to be a bundler installed (Vite, Rollup, Snowpack, or webpack).")}\nCreate or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} if this is wrong.`);
		}

		const featuresList = passedFeatures ?? [];
		const scriptsPassed = scripts.filter((script) => featuresList.includes(script));
		if (scriptsPassed.length === 0) script = "javascript";
		else if (scriptsPassed.length === 1) script = scriptsPassed[0];
		else throw new Error(`too many script languages specified: ${inspect(scriptsPassed)}`);

		const styleFrameworksPassed = /** @type {StyleFramework[]} */ (Object.keys(styleLanguageForFramework)).filter((styleFramework) => featuresList.includes(styleFramework));
		if (styleFrameworksPassed.length === 0) styleFramework = undefined;
		else if (styleFrameworksPassed.length === 1) styleFramework = styleFrameworksPassed[0];
		else throw new Error(`too many style frameworks specified: ${inspect(styleFrameworksPassed)}`);

		const styleLanguagesPassed = styleLanguages.filter((styleLanguage) => featuresList.includes(styleLanguage));
		if (styleLanguagesPassed.length === 0) {
			if (styleFramework) {
				styleLanguage = styleLanguageForFramework[styleFramework];
				featuresList.push(styleLanguage);
			} else styleLanguage = "css";
		} else if (styleLanguagesPassed.length === 1) {
			if (styleFramework) {
				styleLanguage = styleLanguageForFramework[styleFramework];
				if (styleLanguagesPassed[0] !== styleLanguage) throw new Error(`wrong style language passed (expected ${styleLanguage} because ${styleFramework} was selected as a framework) but was given ${styleFrameworksPassed[0]}`);
			} else styleLanguage = styleLanguagesPassed[0];
		} else throw new Error(`too many style languages specified: ${inspect(styleLanguagesPassed)}`);

		other = others.filter((other) => featuresList.includes(other));
		quality = qualities.filter((other) => featuresList.includes(other));

		const deploysPassed = deploys.filter((deploy) => featuresList.includes(deploy));

		if (deploysPassed.length === 0) deploy = undefined;
		else if (deploysPassed.length === 1) deploy = deploysPassed[0];
		else throw new Error(`too many deployment targets specified: ${inspect(deploysPassed)}`);

		// Options parsing
		const passedArgsCopy = { ...passedArgs };

		// Shorthand so that npx svelte-add tailwindcss --jit
		// is interpreted the same as npx svelte-add tailwindcss --tailwindcss-jit
		// (since that's just redundant)
		if (featuresList.length === 1) {
			const adderPrefix = `${featuresList[0]}-`;
			for (const [arg, value] of Object.entries(passedArgsCopy)) {
				if (arg.startsWith(adderPrefix)) continue;
				passedArgsCopy[`${adderPrefix}${arg}`] = value;
				delete passedArgsCopy[arg];
			}
		}

		for (const adder of featuresList) {
			/** @type {AdderOptions<any>} */
			let options;
			try {
				({ options } = await getAdderMetadata({ adder }));
			} catch (/** @type {any} */ e) {
				if (e.code === "ERR_MODULE_NOT_FOUND") continue;
				else throw e;
			}
			const defaults = Object.fromEntries(Object.entries(options).map(([option, data]) => [option, data.default]));

			adderOptions[adder] = { ...defaults };

			const adderPrefix = `${adder}-`;
			for (const [arg, value] of Object.entries(passedArgsCopy)) {
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

				delete passedArgsCopy[`${adderPrefix}${option}`];
			}
		}

		presets = featuresList.filter((adderOrPreset) => adderOrPreset.includes("/"));

		demos = false;
		if (passedDemos === true || passedDemos === "true") demos = true;
		else if (passedDemos === false || passedDemos === "false") demos = false;
		else if (passedDemos !== undefined) throw new Error(`unexpected value for demos ${inspect(passedDemos)}`);

		packageManager = passedPackageManager ?? defaultPackageManager;

		if (passedPackageManager == "pnpm") npx = "pnpx";
		else if (passedPackageManager == "npm") npx = "npx";
		else npx = defaultNpx;

		install = defaultInstall;
		if (passedInstall === true || passedInstall === "true") install = true;
		else if (passedInstall === false || passedInstall === "false") install = false;
		else if (passedInstall !== undefined) throw new Error(`unexpected value for install ${inspect(passedInstall)}`);

		const remainingArgs = Object.keys(passedArgsCopy);
		if (remainingArgs.length !== 0) throw new Error(`${inspect(passedArgsCopy)} were passed as arguments but none of the adders specified (${inspect(passedFeatures)}), nor svelte-add itself, expected them, so they won't be used. Try running the command again without them.`);
	} else {
		/**
		 * @param {object} param0
		 * @param {string} param0.adder
		 */
		const promptForOptions = async ({ adder }) => {
			const { options } = await getAdderMetadata({ adder });

			adderOptions[adder] = {};

			for (const [option, { context, default: default_, question }] of Object.entries(options)) {
				const message = `${question}\n${colors.gray(context)}\n`;
				if (typeof default_ === "boolean") {
					const { answer } = await prompts({
						choices: [
							{
								title: "No",
								value: false,
							},
							{
								title: "Yes",
								value: true,
							},
						],
						initial: default_ ? 1 : 0,
						message,
						name: "answer",
						type: "select",
					});
					adderOptions[adder][option] = answer;
				} else if (typeof default_ === "string") {
					const { answer } = await prompts({
						initial: default_,
						message,
						name: "answer",
						type: "text",
					});
					adderOptions[adder][option] = answer;
				} else {
					throw new Error(`svelte-add currently doesn't support non-boolean-non-string arguments: the ${adder} adder expected a ${typeof default_} for the ${inspect(option)} option\nThis is definitely not supposed to happen, so please create or find an existing issue at "https://github.com/svelte-add/svelte-add/issues" with the full command output.`);
				}
			}
		};

		if (outputFolderMustBe) {
			givenProjectDirectory = ".";
		} else {
			({ givenProjectDirectory } = await prompts({
				initial: "new-svelte-app",
				message: "What directory should your app be created in?",
				name: "givenProjectDirectory",
				type: "text",
			}));
		}
		projectDirectory = resolve(process.cwd(), givenProjectDirectory);
		// TODO: move to synchronous validate in prompts
		const folderInfo = await getFolderInfo({ projectDirectory });
		if (!folderInfo.empty && !outputFolderMustBe) exit(`${inspect(givenProjectDirectory)} isn't an empty directory`);
		else if (outputFolderMustBe) {
			if (folderInfo.empty) exit("There is no valid Svelte project in this directory because it's empty, so svelte-add cannot run");
			if (folderInfo.bundler === undefined) exit("There is no valid Svelte project in this directory because there doesn't seem to be a bundler installed (Vite, Rollup, Snowpack, or webpack).");
		}

		presets = [];

		({ script } = await prompts({
			choices: await Promise.all(
				scripts.map(async (script) => ({
					title: (await getAdderMetadata({ adder: script })).name,
					value: script,
				}))
			),
			message: "What scripting language will you write your app in?",
			name: "script",
			type: "select",
		}));
		await promptForOptions({ adder: script });

		({ styleLanguage } = await prompts({
			choices: await Promise.all(
				styleLanguages.map(async (styleLanguage) => {
					/** @type {import("prompts").Choice} */
					const choice = {
						title: (await getAdderMetadata({ adder: styleLanguage })).name,
						value: styleLanguage,
					};

					if (styleFrameworksForLanguage[styleLanguage] !== undefined) {
						const frameworks = await Promise.all(styleFrameworksForLanguage[styleLanguage].map(async (styleFramework) => (await getAdderMetadata({ adder: styleFramework })).name));
						choice.title += colors.gray(` (used by ${frameworks.join(" and ")})`);
					}

					return choice;
				})
			),
			message: "What language will you write your app styles in?",
			name: "styleLanguage",
			type: "select",
		}));
		await promptForOptions({ adder: styleLanguage });

		if (styleFrameworksForLanguage[styleLanguage]) {
			({ styleFramework } = await prompts({
				choices: [
					{
						title: `None ${colors.gray(`(write ${(await getAdderMetadata({ adder: styleLanguage })).name} by hand)`)}`,
						value: undefined,
					},
					...(await Promise.all(
						styleFrameworksForLanguage[styleLanguage].map(async (styleFramework) => ({
							title: (await getAdderMetadata({ adder: styleFramework })).name,
							value: styleFramework,
						}))
					)),
				],
				message: "What framework will you use for your app's styles?",
				name: "styleFramework",
				type: "select",
			}));
		}
		if (styleFramework) await promptForOptions({ adder: styleFramework });

		({ other } = await prompts({
			choices: await Promise.all(
				others.map(async (other) => ({
					title: (await getAdderMetadata({ adder: other })).name,
					value: other,
				}))
			),
			message: "What other features do you want for your app?",
			name: "other",
			type: "multiselect",
		}));
		for (const otherFeature of other) await promptForOptions({ adder: otherFeature });

		({ quality } = await prompts({
			choices: await Promise.all(
				qualities.map(async (quality) => ({
					title: (await getAdderMetadata({ adder: quality })).name,
					value: quality,
				}))
			),
			message: "What code quality tools do you want to help maintain your app?",
			name: "quality",
			type: "multiselect",
		}));
		for (const qualityFeature of quality) await promptForOptions({ adder: qualityFeature });

		({ deploy } = await prompts({
			choices: [
				{
					title: `Nowhere ${colors.gray(`(set up a deployment target later)`)}`,
					value: undefined,
				},
				...(await Promise.all(
					deploys.map(async (deploy) => ({
						title: (await getAdderMetadata({ adder: deploy })).name,
						value: deploy,
					}))
				)),
			],
			message: "Where will you deploy your app?",
			name: "deploy",
			type: "select",
		}));
		if (deploy) await promptForOptions({ adder: deploy });

		({ demos } = await prompts({
			choices: [
				{
					title: `No. ${colors.gray(`I am very familiar with the application framework and all the tools I've selected, so I fully understand how to use them without any guidance.`)}`,
					value: false,
				},
				{
					title: "Yes",
					value: true,
				},
			],
			initial: 1,
			message: "Do you want example and demonstration code added to your app to demonstrate how to use the tools you've selected?",
			name: "demos",
			type: "select",
		}));

		const installedPackageManagers = /** @type {PackageManager[]} */ Object.entries(environment.packageManagers)
			.filter((packageManagerAndInstalled) => packageManagerAndInstalled[1])
			.map(([packageManager]) => packageManager);
		if (installedPackageManagers.length === 1) {
			({ install } = await prompts({
				choices: [
					{
						title: `No. ${colors.gray(`I will install dependencies manually.`)}`,
						value: false,
					},
					{
						title: "Yes",
						value: true,
					},
				],
				initial: defaultInstall ? 1 : 0,
				message: `Should your app's dependencies be installed with ${defaultPackageManager} right now?`,
				name: "install",
				type: "select",
			}));

			packageManager = defaultPackageManager;
			npx = defaultNpx;
		} else {
			const defaultPackageManagerIndex = installedPackageManagers.indexOf(defaultPackageManager);

			const { packageManagerOrUndefined } = await prompts({
				choices: [
					{
						title: `None. ${colors.gray(`I will install dependencies manually.`)}`,
						value: undefined,
					},
					...installedPackageManagers.map((packageManager) => ({
						title: packageManager,
						value: packageManager,
					})),
				],
				initial: defaultPackageManagerIndex + 1,
				message: "What package manager should be used to install your app's dependencies right now?",
				name: "packageManagerOrUndefined",
				type: "select",
			});

			if (packageManagerOrUndefined) {
				packageManager = packageManagerOrUndefined;

				if (packageManager === "pnpm") npx = "pnpx";
				else npx = "npx";

				install = true;
			} else {
				packageManager = defaultPackageManager;
				npx = defaultNpx;
				install = false;
			}
		}
	}

	return {
		givenProjectDirectory,
		projectDirectory,
		presets,
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

/**
 * @template {string} Tool
 * @template {any} Extensions
 * @typedef {Record<Tool, {
 *     detect: [string, string[]],
 * } & Extensions>} Tools
 */

/** @typedef {"npm" | "pnpm" | "yarn"} PackageManager */
/** @type {Tools<PackageManager, {install: [string, string[]], init: [string, string[]]}>} */
export const packageManagers = {
	npm: {
		detect: ["npm", ["--version"]],
		install: ["npm", ["install"]],
		init: ["npm", ["init"]],
	},
	pnpm: {
		detect: ["pnpm", ["--version"]],
		install: ["pnpm", ["install"]],
		init: ["pnpm", ["init"]],
	},
	yarn: {
		detect: ["yarn", ["--version"]],
		install: ["yarn", ["install"]],
		init: ["npm", ["init"]],
	},
};

/** @typedef {"npx" | "pnpx"} NPX */
/** @type {Tools<NPX, {}>} */
export const npxs = {
	npx: {
		detect: ["npx", ["--version"]],
	},
	pnpx: {
		detect: ["pnpx", ["--version"]],
	},
};

/**
 * @template {string} Tool
 * @param {object} param0
 * @param {NodeJS.Platform} param0.platform
 * @param {Tools<Tool, {}>} param0.tools
 * @returns {Promise<Record<Tool, boolean>>}
 */
const getAvailable = async ({ platform, tools }) =>
	Object.fromEntries(
		await Promise.all(
			/** @type {Tool[]} */ (Object.keys(tools)).map(async (tool) => {
				const toolData = tools[tool];
				let [command, commandArgs] = toolData.detect;
				if (platform === "win32") command += ".cmd";

				try {
					await promisify(exec)(`${command} ${commandArgs.join(" ")}`);
				} catch {
					return [tool, false];
				}
				return [tool, true];
			})
		)
	);

/**
 * @typedef {Object} Environment
 * @property {Record<NPX, boolean>} npxs
 * @property {Record<PackageManager, boolean>} packageManagers
 * @property {NodeJS.Platform} platform
 *
 * @returns {Promise<Environment>}
 */
export const getEnvironment = async () => {
	const platform = process.platform;

	const [npxsAvailable, packageManagersAvailable] = await Promise.all([getAvailable({ platform, tools: npxs }), getAvailable({ platform, tools: packageManagers })]);

	return {
		npxs: npxsAvailable,
		packageManagers: packageManagersAvailable,
		platform,
	};
};

/**
 * @typedef { "rollup" | "snowpack" | "vite" | "webpack"} Bundler
 *
 * @typedef {Object} FolderInfo
 * @property {Bundler | undefined} bundler
 * @property {import("./package-versions").Dependencies} allDependencies
 * @property {boolean} empty
 * @property {boolean} kit
 * @property {"commonjs" | "module" | undefined} packageType
 *
 * @param {object} param0
 * @param {string} param0.projectDirectory
 * @returns {Promise<FolderInfo>}
 */
export const getFolderInfo = async ({ projectDirectory }) => {
	let files = [];
	try {
		files = await readdir(projectDirectory);
	} catch (/** @type {any} */ e) {
		if (e.code !== "ENOENT") throw e;
	}

	if (files.length === 0) {
		return {
			allDependencies: {},
			bundler: undefined,
			empty: true,
			kit: false,
			packageType: undefined,
		};
	}

	const packageJson = await readFile({
		path: join(projectDirectory, "/package.json"),
	});

	const pkg = JSON.parse(packageJson.text || "{}");

	const packageType = pkg.type;

	/** @type {import("./package-versions").Dependencies} */
	const dependencies = pkg.dependencies ?? {};
	/** @type {import("./package-versions").Dependencies} */
	const devDependencies = pkg.devDependencies ?? {};
	const allDependencies = { ...dependencies, ...devDependencies };

	const kit = "@sveltejs/kit" in allDependencies;

	/** @type {Bundler | undefined} */
	let bundler;

	// Vite is a dependency of SvelteKit now
	if (kit) bundler = "vite";
	else if ("vite" in allDependencies) bundler = "vite";
	else if ("rollup" in allDependencies) bundler = "rollup";
	else if ("snowpack" in allDependencies) bundler = "snowpack";
	else if ("webpack" in allDependencies) bundler = "webpack";

	return {
		allDependencies,
		bundler,
		empty: false,
		kit,
		packageType,
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
	} catch (/** @type {any} */ e) {
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
 * @property {FolderInfo} folderInfo
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
 * @param {string} param0.projectDirectory
 * @param {FolderInfo} param0.folderInfo
 * @returns {Promise<Record<Heuristic["description"], boolean>>}
 */
export const detectAdder = async ({ adder, projectDirectory, folderInfo }) => {
	/** @type {{ heuristics: Heuristic[] }} */
	const { heuristics } = await import(`./adders/${adder}/__detect.js`);

	return Object.fromEntries(
		await Promise.all(
			heuristics.map(async (heuristic) => [
				heuristic.description,
				await heuristic.detector({
					folderInfo,
					readFile({ path }) {
						return readFile({ path: join(projectDirectory, path) });
					},
				}),
			])
		)
	);
};

/**
 * @typedef {Object} ApplyPresetArg
 * @property {string[]} args
 * @property {NodeJS.Platform} platform
 * @property {string} projectDirectory
 * @property {NPX} npx
 * @property {string} preset
 *
 * @param {ApplyPresetArg} param0
 * @returns {Promise<void>}
 */
export const applyPreset = ({ args, platform, projectDirectory, npx, preset }) =>
	new Promise((resolve, reject) => {
		if (!args.includes("--no-ssh")) args = [...args, "--no-ssh"];

		let command = npx;
		if (platform === "win32") command += ".cmd";

		const subprocess = spawn(command, ["--yes", "--package", "use-preset", "apply", preset, ...args], {
			cwd: projectDirectory,
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
 * @property {function(Omit<ApplyPresetArg, "npx" | "platform" | "projectDirectory">): ReturnType<typeof applyPreset>} applyPreset
 * @property {Environment} environment
 * @property {FolderInfo} folderInfo
 * @property {function({ prod?: boolean, package: keyof typeof packageVersions, versionOverride?: string }): Promise<void>} install
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
 *     context: string;
 *     default: NameToType[name];
 *     question: string;
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
 * @param {string} param0.projectDirectory
 * @param {Environment} param0.environment
 * @param {FolderInfo} param0.folderInfo
 * @param {NPX} param0.npx
 * @param {Options} param0.options
 * @returns {Promise<void>}
 */
export const runAdder = async ({ adder, projectDirectory, environment, folderInfo, npx, options }) => {
	/** @type {{ run: AdderRun<Options> }} */
	const { run } = await import(`./adders/${adder}/__run.js`);

	await run({
		applyPreset({ ...args }) {
			return applyPreset({ ...args, platform: environment.platform, projectDirectory, npx });
		},
		environment,
		folderInfo,
		async install({ prod = false, package: pkg, versionOverride }) {
			await updateJson({
				path: join(projectDirectory, "/package.json"),
				async json({ obj }) {
					const version = versionOverride ?? packageVersions[pkg];

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
			return updateCss({ path: join(projectDirectory, path), ...args });
		},
		updateFile({ path, ...args }) {
			return updateFile({ path: join(projectDirectory, path), ...args });
		},
		updateJson({ path, ...args }) {
			return updateJson({ path: join(projectDirectory, path), ...args });
		},
		updateJavaScript({ path, ...args }) {
			return updateJavaScript({ path: join(projectDirectory, path), ...args });
		},
		updateSvelte({ path, ...args }) {
			return updateSvelte({ path: join(projectDirectory, path), ...args });
		},
	});
};

/**
 * @param {object} param0
 * @param {PackageManager} param0.packageManager
 * @param {NodeJS.Platform} param0.platform
 * @param {string} param0.projectDirectory
 * @returns {Promise<void>}
 */
export const installDependencies = ({ packageManager, platform, projectDirectory }) =>
	new Promise((resolve, reject) => {
		let [command, commandArgs] = packageManagers[packageManager].install;
		if (platform === "win32") command += ".cmd";

		const subprocess = spawn(command, commandArgs, {
			cwd: projectDirectory,
			stdio: "pipe",
			timeout: 90000,
		});

		let body = "";

		subprocess.stderr.on("data", (chunk) => {
			body += chunk;
		});

		subprocess.on("close", (code) => {
			if (code !== 0) reject(new Error(`${code} ${body}`));
			else resolve(undefined);
		});
		subprocess.on("error", (code) => reject(new Error(`${code} ${body}`)));
	});
