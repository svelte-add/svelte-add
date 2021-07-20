import colors from "kleur";
import mri from "mri";
import { resolve } from "path";
import { applyPreset, detectAdder, getAdderMetadata, getChoices, getEnvironment, runAdder } from "svelte-add";
import { fresh } from "./__init.js";

// Show the package version to make debugging easier
import { createRequire } from "module";
import { spawn } from "child_process";
import { inspect } from "util";
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
	console.log(`${colors.bold("➕ Svelte Add's SvelteKit app initializer")} (Version ${version})`);

	const args = process.argv.slice(2);
	const { _: output, with: addersJoined, ...parsedArgs } = mri(args);
	const addersAndPresets = addersJoined.split("+");

	if (output.length > 1) exit(`${colors.red("TODO: explain this error.")}\nCreate or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} if this is wrong.`);

	const cwd = resolve(process.cwd(), ...output);

	let environment = await getEnvironment({ cwd });

	if (!environment.empty) exit(`${colors.red(`${inspect(output[0])} isn't an empty directory, so the app initializer shouldn't run.`)}\nCreate or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} if this is wrong.`);

	const choices = await getChoices({
		addersAndPresets,
		environment,
		parsedArgs,
	});

	await fresh({
		demo: choices.demos,
		dir: cwd,
		eslint: choices.quality.includes("eslint"),
		packageManager: choices.packageManager,
		prettier: choices.quality.includes("prettier"),
		typescript: choices.script === "typescript",
	});

	/** @type {string[]} */
	const features = [choices.script, choices.styleLanguage, ...(choices.styleFramework ? [choices.styleFramework] : []), ...choices.other, ...choices.quality, ...(choices.deploy ? [choices.deploy] : [])];

	const adders = features.filter((feature) => !["css", "eslint", "javascript", "prettier", "typescript"].includes(feature));

	/** @type {string[]} */
	const workingFeatures = [];

	for (const preset of choices.presets) {
		try {
			await applyPreset({ args, cwd, npx: choices.npx, preset });
		} catch (e) {
			console.log();
			console.log(colors.bold(preset));

			throw e;
		}
	}

	// Running presets has changed the environment
	environment = await getEnvironment({ cwd });

	for (const adder of adders) {
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

	for (const feature of features) {
		const postRunCheck = await detectAdder({
			adder: feature,
			cwd,
			environment,
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

	workingFeatures.push(...choices.presets);

	if (choices.install)
		await new Promise((resolve, reject) => {
			const subprocess = spawn(choices.packageManager, ["install"], {
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

	console.log(colors.green(`🪄 Your ${workingFeatures.join(" + ")} SvelteKit app is ready!`));

	if (choices.install) {
		console.log(`  1. cd ${output}`);
		console.log(`  2. ${choices.packageManager} run dev -- --open  # start developing with a browser open`);
	} else {
		console.log(`  1. cd ${output}`);
		console.log(`  2. ${choices.packageManager} install`);
		console.log(`  3. ${choices.packageManager} run dev -- --open  # start developing with a browser open`);
	}
};

main();
