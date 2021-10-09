import { spawn } from "child_process";
import { packageManagers } from "svelte-add";

/**
 * @param {number} ms
 * @returns {Promise<undefined>}
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @param {Object} param0
 * @param {boolean} param0.demo
 * @param {string} param0.dir
 * @param {boolean} param0.eslint
 * @param {import("svelte-add").PackageManager} param0.packageManager
 * @param {NodeJS.Platform} param0.platform
 * @param {boolean} param0.prettier
 * @param {boolean} param0.runningTests
 * @param {boolean} param0.typescript
 */
export const fresh = async ({ demo, dir, eslint, packageManager, platform, prettier, typescript }) => {
	let [command, commandArgs] = packageManagers[packageManager].init;
	if (platform === "win32") command += ".cmd";

	const subprocess = spawn(command, [...commandArgs, "svelte@next", dir], {
		stdio: "pipe",
		timeout: 8000,
	});

	let body = "";

	subprocess.stderr.on("data", (chunk) => {
		body += chunk;
	});

	subprocess.on("close", (code) => {
		if (code !== 0) throw new Error(body);
	});
	subprocess.on("error", () => {
		throw new Error(body);
	});

	/** @param {string} content */
	const waitForWrite = async (content) => {
		// TODO: this is good enough until https://github.com/sveltejs/kit/pull/1231#issuecomment-827037397
		await wait(300);
		subprocess.stdin.write(content);
	};

	await wait(2000);
	if (!demo) await waitForWrite("\x1B[B");
	await waitForWrite("\n");

	if (typescript) await waitForWrite("\x1B[C");
	await waitForWrite("\n");

	if (eslint) await waitForWrite("\x1B[C");
	await waitForWrite("\n");

	if (prettier) await waitForWrite("\x1B[C");
	await waitForWrite("\n");

	subprocess.stdin.end();

	// Give files a chance to reach the filesystem
	await wait(300);
};
