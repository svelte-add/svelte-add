import colors from "kleur";
import { applyPreset, detectAdder, getEnvironment, runAdder } from "./index.js";

/** @param {string} text - The error message to display when exiting */
const exit = (text) => {
	console.error(text);
	process.exit(1);
}

const main = async () => {
	console.log(colors.bold("➕ Svelte Add"));
	console.log(colors.yellow("The project directory you're giving to this command cannot be guaranteed to be fresh. If any issues arise after running this command, please try again, making sure you've run it on a freshly initialized SvelteKit or Vite–Svelte app template."));

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

	const adders = addersJoined.split("+");

	for (const adder of adders) {
		console.log();
		console.log(colors.bold(adder));

		if (adder.includes("/")) {
			await applyPreset({ args, cwd, npx: preferredNpx, preset: adder });
			console.log(`${colors.green(` ✅ has been set up, but because it's a non-core adder, cannot be determined to have been set up correctly.`)}\nCreate or find an existing issue at ${colors.cyan(`https://github.com/${adder}/issues`)} if this is wrong.`);
			continue;
		}

		let preRunCheck;
		
		// TODO: make detection / pre run checks happen in a batch rather than before each adder
		try {
			preRunCheck = await detectAdder({
				adder,
				cwd,
				environment,
			});
		} catch (e) {
			if (e.code === "ERR_MODULE_NOT_FOUND") exit(`${colors.red(`  ❌ doesn't exist as an adder.`)} Have you spelled it correctly?\nCreate or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} if this is wrong.`);

			throw e;
		}
		
		if (Object.values(preRunCheck).every(Boolean)) {
			console.log(`${colors.green(` ✅ already set up! skipping.`)}\nCreate or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} if this is wrong.`);
			continue;
		} else if (Object.values(preRunCheck).some(Boolean)) {
			for (const [description, passed] of Object.entries(preRunCheck)) {
				if (passed) console.log(colors.green(`  ✅ ${description}`));
				else console.log(colors.red(`  ❌ ${description}`));
			}
			exit(`\n${colors.red(`  ❌ seems to have been partially set up in a way that can't be automatically fixed? (see above)`)}\nCreate or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} if this is wrong.`);
		}

		await runAdder({
			adder,
			cwd,
			environment,
			npx: preferredNpx,
			// TODO: option parsing
			options: {},
		});

		// The environment has changed because it now has the integration!
		environment = await getEnvironment({ cwd });
		const postRunCheck = await detectAdder({
			adder,
			cwd,
			environment,
		});

		// TODO: make detection / post run checks happen in a batch rather than before each adder
		// This would also detect if one integration overrode another rather than appending to them
		if (!Object.values(postRunCheck).every(Boolean)) {
			for (const [description, passed] of Object.entries(postRunCheck)) {
				if (passed) console.log(colors.green(`  ✅ ${description}`));
				else console.log(colors.red(`  ❌ ${description}`));
			}

			exit(`\n${colors.red(`  ❌ was supposed to be set up for you but it appears not to have been?! (see above)`)}\nThis is definitely not supposed to happen, so please create or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} with the full command output.`);
		} else {
			console.log(`${colors.green(` ✅ successfully set up!`)}\nCreate or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} if this is wrong.`);
		}
	}
};

main();
