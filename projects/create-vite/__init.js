import { spawn } from "child_process";
import { mkdir } from "fs/promises";

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
export const fresh = async ({ dir, packageManager, typescript }) => {
	await mkdir(dir, {
		recursive: true,
	});

	const subprocess = spawn(packageManager, ["init", "@vitejs/app", dir, "--", "--template", typescript ? "svelte-ts" : "svelte"], {
		stdio: "pipe",
		timeout: 8000,
	});

	const initialization = new Promise((resolve, reject) => {
		subprocess.on("close", (code) => {
			if (code !== 0) reject(new Error(`${code}`));
			else resolve(undefined);
		});
		subprocess.on("error", (code) => reject(new Error(`${code}`)));
	});

	/** @param {string} content */
	const waitForWrite = async (content) => {
		// TODO: this is good enough until https://github.com/sveltejs/kit/pull/1231#issuecomment-827037397
		await wait(300);
		subprocess.stdin.write(content);
	};

	await wait(2000);
	if (!isValidPackageName(dir)) await waitForWrite("\n\n");

	subprocess.stdin.end();
	await initialization;
};
