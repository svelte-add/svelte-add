import { packageVersions } from "./projects/svelte-add/package-versions.js";
import latestVersion from "latest-version";
import { readFile, writeFile } from "fs/promises";
import * as ncu from "npm-check-updates";

console.log("start updating package.json across all projects");
await updatePackageJson();

console.log("\n\n\n\nstart updating package-versions.js");
await upgradePackageVersions();

async function updatePackageJson() {
	const upgraded = await ncu.run({
		upgrade: true,
		deep: true,
	});
	console.log(upgraded);
}

async function upgradePackageVersions() {
	const filePath = "./projects/svelte-add/package-versions.js";

	let text = (await readFile(filePath)).toString();

	for (const [key, value] of Object.entries(packageVersions)) {
		const latestPackageVersion = await latestVersion(key);

		const currentData = '"' + key + '": "' + value + '"';
		const altCurrentData = "" + key + ': "' + value + '"';
		const newData = '"' + key + '": "^' + latestPackageVersion + '"';
		const altNewData = "" + key + ': "^' + latestPackageVersion + '"';

		text = text.replace(currentData, newData);
		text = text.replace(altCurrentData, altNewData);

		if (value.replace("^", "") !== latestPackageVersion) {
			console.log(`upgraded ${key} to ${latestPackageVersion}`);
		}
	}

	await writeFile(filePath, text);
}
