// @ts-check
import { execSync } from "node:child_process";
import { relative } from "node:path";

if (!process.env.CHANGED_DIRS) throw new Error("CHANGED_DIRS is missing");

const dirs = process.env.CHANGED_DIRS.split(" ");
const json = execSync(`pnpm -r list --only-projects --json`).toString("utf8");
/** @type {Array<import("../packages/core/utils/common.ts").Package & { path: string }>} */
const depsMap = JSON.parse(json);
const packagesToPublish = /** @type {Set<string>} */ (new Set());

for (const dir of dirs) {
    getDependents(dir);
}

// keep looping until we've acquired all dependents
let prev = packagesToPublish.size;
while (packagesToPublish.size === prev) {
    // @ts-expect-error silly error
    for (const pkg of packagesToPublish) {
        getDependents(pkg);
    }
}

const toPublish = Array.from(packagesToPublish).join(" ");
execSync(`pnpm dlx pkg-pr-new@0.0 publish --pnpm ${toPublish}`, { stdio: "inherit" });

/**
 * @param {string} path
 */
function getDependents(path) {
    const pkg = depsMap.find((pkg) => pkg.path.endsWith(path));
    if (!pkg) throw new Error("couldn't find package in dependency map");

    const dependents = depsMap.filter((dep) => dep.dependencies?.[pkg.name] || dep.devDependencies?.[pkg.name]);
    dependents.forEach((dep) => {
        const relativePath = relative(".", dep.path);
        packagesToPublish.add(relativePath);
    });
}
