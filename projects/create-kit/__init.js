import { packageManagers, runCommand } from "svelte-add";

/**
 * @param {number} ms
 * @returns {Promise<undefined>}
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** @type {import("@svelte-add/app-initializer-tools").Initializer} */
export const fresh = async ({ demo, dir, eslint, packageManager, platform, prettier, typescript }) => {
	let [command, commandArgs] = packageManagers[packageManager].init;
	if (platform === "win32") command += ".cmd";

	await runCommand({
		command: [command, ...commandArgs, "--yes", "svelte@next", dir],
		cwd: process.cwd(),
		async interact({ subprocess }) {
			/** @param {string} content */
			const waitForWrite = async (content) => {
				// TODO: this is good enough until https://github.com/sveltejs/kit/pull/1231#issuecomment-827037397
				await wait(300);
				subprocess.stdin.write(content);
			};

			await wait(4000);

			if (!demo) await waitForWrite("\x1B[B");
			await waitForWrite("\n");

			if (typescript) await waitForWrite("\x1B[C");
			await waitForWrite("\n");

			if (eslint) await waitForWrite("\x1B[C");
			await waitForWrite("\n");

			if (prettier) await waitForWrite("\x1B[C");
			await waitForWrite("\n");

			subprocess.stdin.end();
		},
	});
};
