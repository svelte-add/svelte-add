import colors from "kleur";
import mri from "mri";
import { applyPreset, detectAdder, getAdderMetadata, getChoices, getEnvironment, getFolderInfo, getToolCommand, installDependencies, npxs, packageManagers, runAdder } from "svelte-add";
import { fresh } from "./__init.js";

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

const main = async () => {
	console.log(`${colors.bold("➕ Svelte Add's SvelteKit app initializer")} (Version ${version})`);

	const cwd = resolve(process.cwd());

	const args = process.argv.slice(2);
	const { _: passedOutput, demos: passedDemos, install: passedInstall, with: passedAddersAndPresetsJoined, ...passedArgs } = mri(args);
	const passedPackageManager = passedArgs["package-manager"];
	delete passedArgs["package-manager"];
	const passedAddersAndPresets = passedAddersAndPresetsJoined === undefined ? undefined : passedAddersAndPresetsJoined.split("+");

	const environment = await getEnvironment();
	const { adderOptions, demos, deploy, givenProjectDirectory, install, npx, packageManager, other, presets, projectDirectory, quality, script, styleFramework, styleLanguage } = await getChoices({
		passedAddersAndPresets,
		defaultDemos: true,
		defaultInstall: true,
		outputFolderMustBe: false,
		environment,
		passedArgs,
		passedDemos,
		passedInstall,
		passedOutput,
		passedPackageManager,
	});
	const npxCommand = getToolCommand({ platform: environment.platform, tool: npx, tools: npxs });
	const packageManagerCommand = getToolCommand({ platform: environment.platform, tool: packageManager, tools: packageManagers });

	await fresh({
		demo: demos,
		dir: projectDirectory,
		eslint: quality.includes("eslint"),
		packageManagerCommand,
		prettier: quality.includes("prettier"),
		runningTests: false,
		typescript: script === "typescript",
	});

	const features = [script, styleLanguage, ...(styleFramework ? [styleFramework] : []), ...other, ...quality, ...(deploy ? [deploy] : [])];
	const adders = features.filter((feature) => !["css", "eslint", "javascript", "prettier", "typescript"].includes(feature));

	/** @type {string[]} */
	const workingFeatures = [];

	for (const preset of presets) {
		try {
			await applyPreset({ args, projectDirectory, npxCommand, preset });
		} catch (e) {
			console.log();
			console.log(colors.bold(preset));

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
				npxCommand,
				options: adderOptions[adder],
			});
		} catch (e) {
			const { name } = await getAdderMetadata({ adder });

			console.log();
			console.log(colors.bold(name));

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
			const { name } = await getAdderMetadata({ adder: feature });

			console.log();
			console.log(colors.bold(name));
			for (const [description, passed] of Object.entries(postRunCheck)) {
				if (passed) console.log(colors.green(`  ✅ ${description}`));
				else console.log(colors.red(`  ❌ ${description}`));
			}

			console.error(`\n${colors.red(`  ❌ was supposed to be set up for you but it appears not to have been?! (see above)`)}\nThis is definitely not supposed to happen, so please create or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} with the full command output.`);
		} else {
			const { name } = await getAdderMetadata({ adder: feature });
			workingFeatures.push(name);
		}
	}

	workingFeatures.push(...presets);

	if (install) await installDependencies({ projectDirectory, packageManagerCommand });

	console.log(colors.green(`🪄 Your ${workingFeatures.join(" + ")} SvelteKit app is ready!`));

	/** @type {string[]} */
	const steps = [];
	if (projectDirectory !== cwd) steps.push(`cd ${givenProjectDirectory}`);
	// TODO: use tool map to show the correct install and script running commands
	if (!install) steps.push(`${packageManager} install`);
	steps.push(`${packageManager} run dev -- --open  # start developing with a browser open`);

	for (const [index, step] of steps.entries()) console.log(`  ${index + 1}. ${step}`);
};

main();
