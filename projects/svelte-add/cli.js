import colors from "kleur";
import { getEnvironment } from ".";
import { applyPreset } from "./compatibility";

/** @param {string} text - The error message to display when exiting */
const exit = (text) => {
	console.error(text);
	process.exit(1);
}

const main = async () => {
	const environment = await getEnvironment({ cwd: process.cwd() });
	
	if (environment.empty) exit(`${colors.red("There is no valid Svelte project in this directory because it's empty, so svelte-add cannot run.")}\nCreate or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} if this is wrong.`);
	if (environment.bundler === undefined) exit(`${colors.red("There is no valid Svelte project in this directory because there doesn't seem to be a bundler installed (Vite, Rollup, Snowpack, or Webpack).")}\nCreate or find an existing issue at ${colors.cyan("https://github.com/svelte-add/svelte-add/issues")} if this is wrong.`);

	const [node, index, addersJoined, ...args] = process.argv;

	if (!addersJoined) {
		// TODO: show the interactive menus instead
		
		exit(`${colors.red("No adder was specified.")}\nRead ${colors.cyan("https://github.com/svelte-add/svelte-add")} to see available adders and usage.`);
	}

	const adders = addersJoined.split("+");

	for (const adder of adders) {
		if (adder.includes("/")) {
			applyPreset({ args, preset: adder, index, node });
		} else {
			const run = await import(`./adders/${adder}/run.js`);
			
			if (run.compatibility) {
				applyPreset({ args, preset: run.compatibility, index, node });
			} else {
				// TODO: run the core adder
			}
		}
	}
};

main();
