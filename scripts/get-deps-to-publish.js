// @ts-check
import { execSync } from "node:child_process";
import { relative } from "node:path";

if (!process.env.CHANGED_DIRS) throw new Error("CHANGED_DIRS is missing");

const json = execSync(`pnpm -r list --only-projects --json`).toString("utf8");
const repoPackages =
    /** @type {Array<import("../packages/core/utils/common.ts").Package & { path: string, private: boolean }>} */ (
        JSON.parse(json)
    );

const modifiedDirs = process.env.CHANGED_DIRS.split(" ");
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
const paths = Array.from(packagesToPublish).join(" ");
execSync(`pnpm dlx pkg-pr-new@0.0 publish --pnpm ${paths}`, { stdio: "inherit" });

/**
 * Finds all dependents and returns their relative paths.
 * @param {string} path
 * @return {string[]}
 */
function getDependents(path) {
    const pkg = repoPackages.find((pkg) => pkg.path.endsWith(path));
    if (!pkg) throw new Error("couldn't find package in dependency map");

    const dependents = repoPackages.filter(
        (dep) => !dep.private && (dep.dependencies?.[pkg.name] || dep.devDependencies?.[pkg.name]),
    );
    return dependents.map((dep) => relative(".", dep.path));
}
