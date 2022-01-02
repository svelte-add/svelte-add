import { mkdir } from "fs/promises";
import { packageManagers, runCommand } from "svelte-add";

/**
 * @param {number} ms
 * @returns {Promise<undefined>}
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @param {string} projectName
 * @returns {boolean}
 */
const isValidPackageName = (projectName) => /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(projectName);

/** @type {import("@svelte-add/app-initializer-tools").Initializer} */
export const fresh = async ({ dir, packageManager, platform, runningTests, typescript }) => {
	await mkdir(dir, { recursive: true });

	let [command, commandArgs] = packageManagers[packageManager].init;

	if (runningTests) {
		command = "pnpx";
		commandArgs = ["--yes", "--package", "create-vite", "create-vite"];
	} else {
		commandArgs = [...commandArgs, "--yes", "vite", "--"];
	}
	if (platform === "win32") command += ".cmd";

	await runCommand({
		command: [command, ...commandArgs, dir, "--template", typescript ? "svelte-ts" : "svelte"],
		cwd: process.cwd(),
		async interact({ subprocess }) {
			/** @param {string} content */
			const waitForWrite = async (content) => {
				await wait(300);
				subprocess.stdin.write(content);
			};

			await wait(2000);

			if (dir === ".") await waitForWrite("svelte-vite-app\n\n");
			else if (!isValidPackageName(dir)) await waitForWrite("\n\n");

			subprocess.stdin.end();
		},
	});
};
