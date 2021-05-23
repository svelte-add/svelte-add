import { spawn } from "child_process";

/**
 * 
 * @param {number} ms 
 * @returns {Promise<undefined>}
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 
 * @param {Object} param0 
 * @param {boolean} param0.demo
 * @param {string} param0.dir
 * @param {boolean} param0.eslint
 * @param {string} param0.packageManager
 * @param {boolean} param0.prettier
 * @param {boolean} param0.typescript
 */
export const fresh = async ({ demo, dir, eslint, packageManager, prettier, typescript }) => {
	const subprocess = spawn(packageManager, ["init", "svelte@next", dir], {
		stdio: "pipe",
		timeout: 8000,
	});

	subprocess.on("close", (code) => {
		if (code !== 0) throw new Error(`${code}`);
	});
	subprocess.on("error", (code) => { throw new Error(`${code}`) });

	/** @param {string} content */
	const waitForWrite = async (content) => {
		// TODO: this is good enough until https://github.com/sveltejs/kit/pull/1231#issuecomment-827037397
		await wait(300);
		subprocess.stdin.write(content);
	}

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
}
