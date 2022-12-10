import { clearLine, cursorTo } from "readline";
import colors from "kleur";
import mri from "mri";
import { applyPreset, detectAdder, getAdderInfo, getChoices, getEnvironment, getFolderInfo, installDependencies, packageManagers, runAdder } from "svelte-add";

// Show the package version to make debugging easier
import { createRequire } from "module";
import { resolve } from "path";

const require = createRequire(import.meta.url);
const pkg = require("./package.json");
let [year, month, day, iteration] = pkg.version.split(".");
if (month.length === 1) month = "0" + month;
day = day.replace("-", "");
if (day.length === 1) day = "0" + day;
if (iteration.length === 1) iteration = "0" + iteration;
const version = `${year}.${month}.${day}.${iteration}`;

// Attribution: https://github.com/sindresorhus/cli-spinners
const spinners = ["🌑 ", "🌒 ", "🌓 ", "🌔 ", "🌕 ", "🌖 ", "🌗 ", "🌘 "];
let spinner = 0;
/** @param {string} label */
const printSpinner = (label) => {
	cursorTo(process.stdout, 0);
	process.stdout.write(`${spinners[spinner]} ${label}...`);

	spinner++;
	if (spinner === spinners.length) spinner = 0;
};

/**
 * @typedef {Object} InitializerArg
 * @property {boolean} demo
 * @property {string} dir
 * @property {boolean} eslint
 * @property {import("svelte-add").PackageManager} packageManager
 * @property {NodeJS.Platform} platform
 * @property {boolean} playwright
 * @property {boolean} prettier
 * @property {boolean} runningTests
 * @property {"typescript" | "checkjs" | null} types
 * @property {boolean} vitest
 *
 * @callback Initializer
 * @param {InitializerArg} param0
 * @returns {void}
 */

/**
 * @param {object} param0
 * @param {string} param0.applicationFramework
 * @param {Initializer} param0.fresh
 */
export const setup = async ({ applicationFramework, fresh }) => {
	console.log(`${colors.bold(`➕ Svelte Add's ${applicationFramework} app initializer`)} (Version ${version})`);

	const cwd = resolve(process.cwd());

	const args = process.argv.slice(2);
	const { _: passedOutput, demos: passedDemos, install: passedInstall, with: passedFeaturesJoined, ...passedArgs } = mri(args);
	const passedPackageManager = passedArgs["package-manager"];
	delete passedArgs["package-manager"];
	const passedFeatures = passedFeaturesJoined === undefined ? undefined : passedFeaturesJoined.split("+");

	const environment = await getEnvironment();
	const { adderOptions, demos, deploy, givenProjectDirectory, install, npx, packageManager, other, presets, projectDirectory, quality, script, styleFramework, styleLanguage } = await getChoices({
		passedFeatures,
		defaultInstall: true,
		outputFolderMustBe: false,
		environment,
		passedArgs,
		passedDemos,
		passedInstall,
		passedOutput,
		passedPackageManager,
	});

	const handle = setInterval(() => {
		printSpinner(`Running the official ${applicationFramework} app initializer`);
	}, 100);

	await fresh({
		demo: demos,
		dir: givenProjectDirectory,
		eslint: quality.includes("eslint"),
		packageManager,
		platform: environment.platform,
		playwright: quality.includes("playwright"),
		prettier: quality.includes("prettier"),
		runningTests: false,
		// TODO: prompt for and check if type-checked javascript was chosen
		types: script === "typescript" ? "typescript" : null,
		vitest: quality.includes("vitest"),
	});

	clearInterval(handle);
	clearLine(process.stdout, 0);
	cursorTo(process.stdout, 0);

	const features = [script, styleLanguage, ...(styleFramework ? [styleFramework] : []), ...other, ...quality, ...(deploy ? [deploy] : [])];
	const adders = features.filter((feature) => !["css", "eslint", "javascript", "playwright", "prettier", "typescript"].includes(feature));

	/** @type {string[]} */
	const workingFeatures = [];
	/** @type {string[]} */
	const failedFeatures = [];

	for (const preset of presets) {
		try {
			await applyPreset({ args, platform: environment.platform, projectDirectory, npx, preset });
		} catch (e) {
			console.log();
			console.log(colors.bold(preset));

			failedFeatures.push(preset);

			throw e;
		}
	}

	let folderInfo = await getFolderInfo({ projectDirectory });

	for (const adder of adders) {
		try {
			await runAdder({
				adder,
				projectDirectory,
				environment,
				folderInfo,
				npx,
				options: adderOptions[adder],
			});
		} catch (e) {
			const { name } = await getAdderInfo({ adder });

			console.log();
			console.log(colors.bold(name));

			failedFeatures.push(name);

			throw e;
		}

		// The folder info has changed because it now has the integration!
		folderInfo = await getFolderInfo({ projectDirectory });
	}

	for (const feature of features) {
		const postRunCheck = await detectAdder({
			adder: feature,
			projectDirectory,
			folderInfo,
		});

		if (!Object.values(postRunCheck).every(Boolean)) {
			const { name } = await getAdderInfo({ adder: feature });

			console.log();
			console.log(colors.bold(name));
			for (const [description, passed] of Object.entries(postRunCheck)) {
				if (passed) console.log(colors.green(`  ✅ ${description}`));
				else console.log(colors.red(`  ❌ ${description}`));
			}

			console.error(`\n${colors.red(`  ❌ was supposed to be set up for you but it appears not to have been?! (see above)`)}\nThis is definitely not supposed to happen, so please create or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} with the full command output.`);

			failedFeatures.push(name);
		} else {
			const { name } = await getAdderInfo({ adder: feature });
			workingFeatures.push(name);
		}
	}

	workingFeatures.push(...presets);

	if (install) {
		const handle = setInterval(() => {
			printSpinner("Installing dependencies");
		}, 100);

		await installDependencies({ packageManager, platform: environment.platform, projectDirectory });

		clearInterval(handle);
		clearLine(process.stdout, 0);
		cursorTo(process.stdout, 0);
	}

	console.log(colors.green(`🪄 Your ${workingFeatures.join(" + ")} ${applicationFramework} app is ready!`));

	if (failedFeatures.length > 0) {
		console.log(colors.red(`❌ Could not identify correct installation of ${failedFeatures.join(" + ")}. \nThis is definitely not supposed to happen, so please create or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} with the full command output.`));
	}

	/** @type {string[]} */
	const steps = [];
	if (projectDirectory !== cwd) steps.push(`cd ${givenProjectDirectory}`);
	if (!install) {
		const [command, commandArgs] = packageManagers[packageManager].install;
		steps.push(`${command} ${commandArgs.join(" ")}`);
		steps.push("Reload your IDE");
	}
	steps.push(`${packageManager} run dev -- --open  # start developing with a browser open`);

	for (const [index, step] of steps.entries()) console.log(`  ${index + 1}. ${step}`);
};
