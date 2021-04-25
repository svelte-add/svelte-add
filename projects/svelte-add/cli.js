import { applyPreset } from "./compatibility";

const main = async () => {
	const [node, index, addersJoined, ...args] = process.argv;

	if (!addersJoined) {
		// TODO: show the interactive menus instead
		
		const colors = (await import("kleur")).default;
		console.error(`${colors.red("No adder was specified.")}\nRead ${colors.cyan("https://github.com/svelte-add/svelte-add")} to see available adders and usage.`);
		process.exit(0);
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
