import { spawn } from "child_process";
import { mkdir } from "fs/promises";
import { packageManagers } from "svelte-add";

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
		commandArgs.push("vite", "--");
	}
	if (platform === "win32") command += ".cmd";

	const subprocess = spawn(command, [...commandArgs, dir, "--template", typescript ? "svelte-ts" : "svelte"], {
		stdio: "pipe",
		timeout: 8000,
	});

	const initialization = new Promise((resolve, reject) => {
		let body = "";

		subprocess.stderr.on("data", (chunk) => {
			body += chunk;
		});

		subprocess.on("close", (code) => {
			if (code !== 0) reject(new Error(body));
			else resolve(undefined);
		});
		subprocess.on("error", () => {
			reject(new Error(body));
		});
	});

	/** @param {string} content */
	const waitForWrite = async (content) => {
		await wait(300);
		subprocess.stdin.write(content);
	};

	await wait(2000);

	if (dir === ".") await waitForWrite("svelte-vite-app\n\n");
	else if (!isValidPackageName(dir)) await waitForWrite("\n\n");

	subprocess.stdin.end();
	await initialization;
};
