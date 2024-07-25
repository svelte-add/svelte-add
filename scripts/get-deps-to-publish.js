/**
 * This tool is used by the pr ci to determine the packages that need to be published to the pkg-pr-new registry.
 * In order to avoid situations where only @svelte-add/core would be published, because it's the only modified package,
 * this tool will also determine the dependent packages and also publish those.
 * PR: https://github.com/svelte-add/svelte-add/pull/408
 */

// @ts-check
import { execSync } from 'node:child_process';
import { relative, join } from 'node:path';
import { existsSync } from 'node:fs';

if (!process.env.CHANGED_DIRS) throw new Error('CHANGED_DIRS is missing');

const json = execSync(`pnpm -r list --only-projects --json`).toString('utf8');
const repoPackages =
	/** @type {Array<import("../packages/core/utils/common.ts").Package & { path: string, private: boolean, peerDependencies?: Record<string, string> }>} */ (
		JSON.parse(json)
	);

const modifiedDirs = process.env.CHANGED_DIRS.split(' ')
	.map((dir) => (dir.startsWith('adders') ? 'adders' : dir))
	.filter((dir) => existsSync(join(dir, 'package.json')));
const packagesToPublish = new Set(modifiedDirs);

// keep looping until we've acquired all dependents
let prev = 0;
while (packagesToPublish.size !== prev) {
	prev = packagesToPublish.size;
	for (const pkg of packagesToPublish) {
		const dependents = getDependents(pkg);
		dependents.forEach((dep) => packagesToPublish.add(dep));
	}
}

// publishes packages to pkg-pr-new
const paths = Array.from(packagesToPublish)
	// remove all private packages
	.filter((dir) => repoPackages.find((pkg) => pkg.path.endsWith(dir))?.private === false)
	.join(' ');

execSync(`pnpm dlx pkg-pr-new@0.0 publish --pnpm ${paths}`, { stdio: 'inherit' });

/**
 * Finds all dependents and returns their relative paths.
 * @param {string} path
 * @return {string[]}
 */
function getDependents(path) {
	const pkg = repoPackages.find((pkg) => pkg.path.endsWith(path));
	if (!pkg) throw new Error(`package ${path} doesn't exist in this repo`);

	const dependents = repoPackages.filter(
		(dep) =>
			!dep.private &&
			(dep.dependencies?.[pkg.name] ||
				dep.devDependencies?.[pkg.name] ||
				dep.peerDependencies?.[pkg.name]),
	);
	return dependents.map((dep) => relative('.', dep.path));
}
