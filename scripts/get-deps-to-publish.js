import { execSync } from "node:child_process";

if (process.env.CHANGED_DIRS) throw new Error("CHANGED_DIRS is missing");

const dirs = process.env.CHANGED_DIRS.split(" ");

const packagesToPublish = new Set();

for (const dir of dirs) {
    const buf = execSync(`pnpm -F ./${dir} list --only-projects --parseable`);
    const deps = buf.toString("utf8").split("\n");
    deps.forEach((dep) => packagesToPublish.add(dep));
}

const toPublish = Array.from(packagesToPublish).join(" ");
process.stdout.write(toPublish);
