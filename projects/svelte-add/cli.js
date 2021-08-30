import colors from "kleur";
import mri from "mri";
import { applyPreset, detectAdder, getAdderMetadata, getChoices, getEnvironment, getToolCommand, installDependencies, packageManagers, runAdder } from "./index.js";

// Show the package version to make debugging easier
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pkg = require("./package.json");
let [year, month, day, iteration] = pkg.version.split(".");
if (month.length === 1) month = "0" + month;
day = day.replace("-", "");
if (day.length === 1) day = "0" + day;
if (iteration.length === 1) iteration = "0" + iteration;
const version = `${year}.${month}.${day}.${iteration}`;

/** @param {string} text - The error message to display when exiting */
const exit = (text) => {
	console.error(text);
	process.exit(1);
};

const main = async () => {
	console.log(`${colors.bold("➕ Svelte Add")} (Version ${version})`);
	const cwd = process.cwd();

	let environment = await getEnvironment({ cwd });

	if (environment.empty) exit(`${colors.red("There is no valid Svelte project in this directory because it's empty, so svelte-add cannot run.")}\nCreate or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} if this is wrong.`);
	if (environment.bundler === undefined) exit(`${colors.red("There is no valid Svelte project in this directory because there doesn't seem to be a bundler installed (Vite, Rollup, Snowpack, or webpack).")}\nCreate or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} if this is wrong.`);

	const args = process.argv.slice(2);
	const { _: addersSeparated, install = false, ...parsedArgs } = mri(args);
	const addersJoined = addersSeparated.join("+");
	const addersAndPresets = addersJoined.split("+");

	// TODO: show the interactive menus instead
	if (!addersJoined) exit(`${colors.red("No adder was specified.")}\nRead ${colors.cyan("https://github.com/svelte-add/svelte-add")} to see available adders and usage.`);

	console.log("The project directory you're giving to this command cannot be determined to be guaranteed fresh — maybe it is, maybe it isn't. If any issues arise after running this command, please try again, making sure you've run it on a freshly initialized SvelteKit or Vite–Svelte app template.");

	const choices = await getChoices({ addersAndPresets, environment, install, parsedArgs });

	/** @type {string[]} */
	const adders = [];
	if (choices.script !== "javascript") adders.push(choices.script);
	if (choices.styleLanguage !== "css") adders.push(choices.styleLanguage);
	if (choices.styleFramework) adders.push(choices.styleFramework);
	adders.push(...choices.other);
	adders.push(...choices.quality);

	for (const preset of choices.presets) {
		console.log();
		console.log(colors.bold(preset));
		await applyPreset({ args, cwd, npx: choices.npx, preset });
		console.log(`${colors.green(` ✅ has been set up, but because it's an external integration adder, cannot be determined to have been set up correctly.`)}\nCreate or find an existing issue at ${colors.cyan(`https://github.com/${preset}/issues`)} if this is wrong.`);
	}

	// Running presets has changed the environment
	environment = await getEnvironment({ cwd });

	/** @type {Set<string>} */
	const addersToRepair = new Set();
	/** @type {Set<string>} */
	const addersToSkip = new Set();

	for (const adder of adders) {
		let preRunCheck;

		try {
			preRunCheck = await detectAdder({
				adder,
				cwd,
				environment,
			});
		} catch (/** @type {any} */ e) {
			console.log();
			console.log(colors.bold(adder));

			if (e.code === "ERR_MODULE_NOT_FOUND") exit(`${colors.red(`  ❌ doesn't exist as an adder.`)} Have you spelled it correctly?\nCreate or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} if this is wrong.`);

			throw e;
		}

		if (Object.values(preRunCheck).every(Boolean)) {
			const { name } = await getAdderMetadata({ adder });
			console.log();
			console.log(colors.bold(name));
			console.log(`${colors.green(` ✅ already set up! skipping.`)}\nCreate or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} if this is wrong.`);
			addersToSkip.add(adder);
		} else if (Object.values(preRunCheck).some(Boolean)) {
			addersToRepair.add(adder);
		}
	}

	for (const adder of adders) {
		if (addersToSkip.has(adder)) continue;

		try {
			await runAdder({
				adder,
				cwd,
				environment,
				npx: choices.npx,
				options: choices.adderOptions[adder],
			});
		} catch (e) {
			const { name } = await getAdderMetadata({ adder });

			console.log();
			console.log(colors.bold(name));

			throw e;
		}

		// The environment has changed because it now has the integration!
		environment = await getEnvironment({ cwd });
	}

	for (const adder of adders) {
		const postRunCheck = await detectAdder({
			adder,
			cwd,
			environment,
		});

		if (!Object.values(postRunCheck).every(Boolean)) {
			const { name } = await getAdderMetadata({ adder });

			console.log();
			console.log(colors.bold(name));
			for (const [description, passed] of Object.entries(postRunCheck)) {
				if (passed) console.log(colors.green(`  ✅ ${description}`));
				else console.log(colors.red(`  ❌ ${description}`));
			}

			if (addersToSkip.has(adder)) console.error(`\n${colors.red(`  ❌ was working before this but is not anymore?! (see above)`)}\nThis is definitely not supposed to happen, so please create or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} with the full command output.`);
			else console.error(`\n${colors.red(`  ❌ was supposed to be set up for you but it appears not to have been?! (see above)`)}\nThis is definitely not supposed to happen, so please create or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} with the full command output.`);
		} else {
			if (addersToSkip.has(adder)) continue;

			const { name } = await getAdderMetadata({ adder });

			console.log();
			console.log(colors.bold(name));
			console.log(`${colors.green(addersToRepair.has(adder) ? ` ✅ successfully set up and repaired (it looks like it was in a broken setup before this command was run)!` : ` ✅ successfully set up!`)}\nCreate or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} if this is wrong.`);
		}
	}

	const packageManagerCommand = getToolCommand({ platform: environment.platform, tool: choices.packageManager, tools: packageManagers });
	if (choices.install) await installDependencies({ cwd, packageManagerCommand });
	else {
		// TODO: print message instructing
	}
};

main();
