import colors from "kleur";
import mri from "mri";
import { inspect } from "util";
import { adderDependencies, applyPreset, detectAdder, getAdderOptions, getEnvironment, runAdder } from "./index.js";

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
	const { _: addersSeparated, ...parsedArgs } = mri(args);
	const addersJoined = addersSeparated.join("+");

	// TODO: show the interactive menus instead
	if (!addersJoined) exit(`${colors.red("No adder was specified.")}\nRead ${colors.cyan("https://github.com/svelte-add/svelte-add")} to see available adders and usage.`);

	const addersAndPresets = addersJoined.split("+");
	const presets = addersAndPresets.filter((adderOrPreset) => adderOrPreset.includes("/"));
	const adders = addersAndPresets.filter((adderOrPreset) => !adderOrPreset.includes("/"));

	// TODO: should this be overrideable?
	let preferredNpx = "npx";
	if (environment.npx.pnpx) preferredNpx = "pnpx";

	// TODO: ask what package manager if multiple options
	// (getChoices)
	let preferredPackageManager = "npm";
	if (environment.packageManagers.pnpm) preferredPackageManager = "pnpm";

	if (process.platform === "win32") {
		preferredNpx += ".cmd";
		preferredPackageManager += ".cmd";
	}

	console.log("The project directory you're giving to this command cannot be determined to be guaranteed fresh — maybe it is, maybe it isn't. If any issues arise after running this command, please try again, making sure you've run it on a freshly initialized SvelteKit or Vite–Svelte app template.");

	/** @type {string[]} */
	const addersToCheck = [];
	for (const adder of adders) {
		const dependencies = adderDependencies[adder];

		if (!dependencies) {
			console.log();
			console.log(colors.bold(adder));
			exit(`${colors.red(`  ❌ doesn't exist as an adder.`)} Have you spelled it correctly?\nCreate or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} if this is wrong.`);
		}

		for (const dependency of dependencies) {
			// TODO / note: this will be rendered unnecessary by `getChoices`:
			// Move dependencies to the front such that
			// tailwindcss+postcss is rewritten as postcss+tailwindcss
			if (addersToCheck.includes(dependency)) addersToCheck.splice(addersToCheck.indexOf(dependency), 1);

			addersToCheck.unshift(dependency);
		}
		if (!addersToCheck.includes(adder)) addersToCheck.push(adder);
	}

	// Shorthand so that npx svelte-add tailwindcss --jit
	// is interpreted the same as npx svelte-add tailwindcss --tailwindcss-jit
	// (since that's just redundant)
	if (adders.length === 1) {
		const adderPrefix = `${adders[0]}-`;
		for (const [arg, value] of Object.entries(parsedArgs)) {
			if (arg.startsWith(adderPrefix)) continue;
			parsedArgs[`${adderPrefix}${arg}`] = value;
			delete parsedArgs[arg];
		}
	}

	/** @type {Record<string, Record<string, any>>} */
	const optionsForAdder = {};
	for (const adder of addersToCheck) {
		const options = await getAdderOptions({ adder });
		const defaults = Object.fromEntries(Object.entries(options).map(([option, data]) => [option, data.default]));

		optionsForAdder[adder] = { ...defaults };

		const adderPrefix = `${adder}-`;
		for (const [arg, value] of Object.entries(parsedArgs)) {
			if (!arg.startsWith(adderPrefix)) {
				if (arg in defaults) exit(colors.red(``));
				continue;
			}

			const option = arg.slice(adderPrefix.length);

			if (!(option in defaults)) exit(colors.red(`${inspect(option)} is not a valid option for the ${adder} adder: ${Object.keys(defaults).length === 0 ? "it doesn't accept any options." : `it accepts ${inspect(Object.keys(defaults))} as options.`}`));

			if (typeof defaults[option] === "boolean") {
				if (value === "true" || value === true) optionsForAdder[adder][option] = true;
				else if (value === "false" || value === false) optionsForAdder[adder][option] = false;
				else exit(colors.red(`${inspect(value)} is not a valid value for the ${adder} adder's ${inspect(option)} option because it needs to be a boolean (true or false)`));
			} else if (typeof defaults[option] === "string") {
				optionsForAdder[adder][option] = value;
			} else {
				exit(`${colors.red(`svelte-add currently doesn't support non-boolean and non-string arguments`)}: the ${adder} adder expected a ${typeof defaults[option]} for the ${inspect(option)} option\nThis is definitely not supposed to happen, so please create or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} with the full command output.`);
			}

			delete parsedArgs[`${adderPrefix}${option}`];
		}
	}

	const remainingArgs = Object.keys(parsedArgs);
	if (remainingArgs.length !== 0) console.warn(colors.yellow(`\n${inspect(parsedArgs)} were passed as arguments but none of the adders specified (${inspect(addersToCheck)}), nor svelte-add itself, expected them, so they won't be used. Try running the command again without them to make this warning go away.`));

	for (const preset of presets) {
		console.log();
		console.log(colors.bold(preset));
		await applyPreset({ args, cwd, npx: preferredNpx, preset });
		console.log(`${colors.green(` ✅ has been set up, but because it's an external integration adder, cannot be determined to have been set up correctly.`)}\nCreate or find an existing issue at ${colors.cyan(`https://github.com/${preset}/issues`)} if this is wrong.`);
	}

	// Running presets has changed the environment
	environment = await getEnvironment({ cwd });

	/** @type {string[]} */
	const addersToRun = [];
	for (const adder of addersToCheck) {
		let preRunCheck;

		try {
			preRunCheck = await detectAdder({
				adder,
				cwd,
				environment,
			});
		} catch (e) {
			console.log();
			console.log(colors.bold(adder));

			if (e.code === "ERR_MODULE_NOT_FOUND") exit(`${colors.red(`  ❌ doesn't exist as an adder.`)} Have you spelled it correctly?\nCreate or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} if this is wrong.`);

			throw e;
		}

		if (Object.values(preRunCheck).every(Boolean)) {
			console.log();
			console.log(colors.bold(adder));
			console.log(`${colors.green(` ✅ already set up! skipping.`)}\nCreate or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} if this is wrong.`);
			continue;
		} else if (Object.values(preRunCheck).some(Boolean)) {
			console.log();
			console.log(colors.bold(adder));
			for (const [description, passed] of Object.entries(preRunCheck)) {
				if (passed) console.log(colors.green(`  ✅ ${description}`));
				else console.log(colors.red(`  ❌ ${description}`));
			}
			exit(`\n${colors.red(`  ❌ seems to have been partially set up before running this command in a way that can't be automatically fixed? (see above)`)}\nCreate or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} if this is wrong.`);
		}

		addersToRun.push(adder);
	}

	for (const adder of addersToRun) {
		try {
			await runAdder({
				adder,
				cwd,
				environment,
				npx: preferredNpx,
				options: optionsForAdder[adder],
			});
		} catch (e) {
			console.log();
			console.log(colors.bold(adder));

			throw e;
		}

		// The environment has changed because it now has the integration!
		environment = await getEnvironment({ cwd });
	}

	for (const adder of addersToCheck) {
		const postRunCheck = await detectAdder({
			adder,
			cwd,
			environment,
		});

		if (!Object.values(postRunCheck).every(Boolean)) {
			console.log();
			console.log(colors.bold(adder));
			for (const [description, passed] of Object.entries(postRunCheck)) {
				if (passed) console.log(colors.green(`  ✅ ${description}`));
				else console.log(colors.red(`  ❌ ${description}`));
			}

			if (addersToRun.includes(adder)) exit(`\n${colors.red(`  ❌ was supposed to be set up for you but it appears not to have been?! (see above)`)}\nThis is definitely not supposed to happen, so please create or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} with the full command output.`);
			else exit(`\n${colors.red(`  ❌ was working before this but is not anymore?! (see above)`)}\nThis is definitely not supposed to happen, so please create or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} with the full command output.`);
		} else {
			if (addersToRun.includes(adder)) {
				console.log();
				console.log(colors.bold(adder));
				console.log(`${colors.green(` ✅ successfully set up!`)}\nCreate or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} if this is wrong.`);
			}
		}
	}
};

main();
