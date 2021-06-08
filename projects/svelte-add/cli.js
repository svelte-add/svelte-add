import colors from "kleur";
import { adderDependencies, applyPreset, detectAdder, getEnvironment, runAdder } from "./index.js";

/** @param {string} text - The error message to display when exiting */
const exit = (text) => {
	console.error(text);
	process.exit(1);
}

const main = async () => {
	console.log(colors.bold("➕ Svelte Add"));
	console.log(colors.yellow("The project directory you're giving to this command cannot be determined to be guaranteed fresh — maybe it is, maybe it isn't. If any issues arise after running this command, please try again, making sure you've run it on a freshly initialized SvelteKit or Vite–Svelte app template."));

	const cwd = process.cwd();

	let environment = await getEnvironment({ cwd });
	
	if (environment.empty) exit(`${colors.red("There is no valid Svelte project in this directory because it's empty, so svelte-add cannot run.")}\nCreate or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} if this is wrong.`);
	if (environment.bundler === undefined) exit(`${colors.red("There is no valid Svelte project in this directory because there doesn't seem to be a bundler installed (Vite, Rollup, Snowpack, or webpack).")}\nCreate or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} if this is wrong.`);

	const [_node, _index, addersJoined, ...args] = process.argv;

	if (!addersJoined) {
		// TODO: show the interactive menus instead
		
		exit(`${colors.red("No adder was specified.")}\nRead ${colors.cyan("https://github.com/svelte-add/svelte-add")} to see available adders and usage.`);
	}

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

	const addersAndPresets = addersJoined.split("+");
	const presets = addersAndPresets.filter(adderOrPreset => adderOrPreset.includes("/"));
	const adders = addersAndPresets.filter(adderOrPreset => !adderOrPreset.includes("/"));

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
			// Move dependencies to the front such that
			// tailwindcss+postcss is rewritten as postcss+tailwindcss
			if (addersToCheck.includes(dependency)) addersToCheck.splice(addersToCheck.indexOf(dependency), 1);

			addersToCheck.unshift(dependency);
		}
		if (!addersToCheck.includes(adder)) addersToCheck.push(adder);
	}

	for (const preset of presets) {
		console.log();
		console.log(colors.bold(preset));
		await applyPreset({ args, cwd, npx: preferredNpx, preset });
		console.log(`${colors.green(` ✅ has been set up, but because it's a non-core adder, cannot be determined to have been set up correctly.`)}\nCreate or find an existing issue at ${colors.cyan(`https://github.com/${preset}/issues`)} if this is wrong.`);
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
				// TODO: option parsing
				options: {},
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
