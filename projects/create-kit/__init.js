import { spawn } from "child_process";
import { packageManagers } from "svelte-add";

/**
 * @param {number} ms
 * @returns {Promise<undefined>}
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** @type {import("@svelte-add/app-initializer-tools").Initializer} */
export const fresh = async ({ demo, dir, eslint, packageManager, platform, prettier, typescript }) => {
	let [command, commandArgs] = packageManagers[packageManager].init;
	if (platform === "win32") command += ".cmd";

	const subprocess = spawn(command, [...commandArgs, "--yes", "svelte@next", dir], {
		stdio: "pipe",
		timeout: 8000,
	});

	const initialization = new Promise((resolve, reject) => {
		let body = "";

		subprocess.stdout.on("data", (chunk) => {
			body += chunk;
		});

		subprocess.stderr.on("data", (chunk) => {
			body += chunk;
		});

		subprocess.on("close", (code) => {
			if (code !== 0) reject(new Error(body));
			else resolve(undefined);

			console.log(body);
		});
		subprocess.on("error", () => {
			reject(new Error(body));
		});
	});

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
	await initialization;
};
