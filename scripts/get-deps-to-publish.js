// @ts-check
import { execSync } from "node:child_process";

if (!process.env.CHANGED_DIRS) throw new Error("CHANGED_DIRS is missing");

const dirs = process.env.CHANGED_DIRS.split(" ");

const json = execSync(`pnpm -r list --only-projects --json`).toString("utf8");
const depsMap = /** @type {import("../packages/core/utils/common.ts").Package[]} */ (JSON.parse(json));
const packagesToPublish = new Set();

for (const dir of dirs) {
    // @ts-expect-error `path` exists, just not on the type
    const pkg = depsMap.find((pkg) => pkg.path.endsWith(dir));
    const dependents = depsMap.filter((dep) => dep.dependencies?.[pkg.name] || dep.devDependencies?.[pkg.name]);
    // @ts-expect-error `path` exists, just not on the type
    dependents.forEach((dep) => packagesToPublish.add(dep.path));
}

const toPublish = Array.from(packagesToPublish).join(" ");
process.stdout.write(toPublish);
