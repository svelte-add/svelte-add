import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import dynamicImportVars from "@rollup/plugin-dynamic-import-vars";
import { preserveShebangs } from "rollup-plugin-preserve-shebangs";
import typescript from "@rollup/plugin-typescript";
import * as fs from "fs";
import path from "path";

const adderFolders = fs
    .readdirSync("./adders/", { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item) => item.name);
const adderNamesAsString = adderFolders.map((x) => `"${x}"`);

/**
 * @param {string} project
 * @param {boolean} isAdder
 */
function getConfig(project, isAdder) {
    const inputs = [];
    let outDir = "";

    if (!isAdder) {
        inputs.push(`./packages/${project}/index.ts`);

        if (project == "cli") inputs.push(`./packages/${project}/website.ts`);
        if (project == "core") inputs.push(`./packages/${project}/internal.ts`);

        outDir = `./packages/${project}/build`;
    } else {
        /**
         * Let's keep the adders in JavaScript, in order to preserve compilation speed.
         * In JavaScript each adders takes about 50-100ms. When we change the file types to
         * Typescript without changing anything else, we already get 1000-1500ms. Since
         * we plan to have many adders, it would make it pretty hard to work with this repo.
         * Since the adders are still typed by JSDoc and have access to all types from the
         * other packages, all the intellisense and so on is still working flawlessly.
         */
        inputs.push(`./adders/${project}/index.js`);

        outDir = `./adders/${project}/build`;
    }

    const projectRoot = path.resolve(path.join(outDir, ".."));
    fs.rmSync(outDir, { force: true, recursive: true });

    const config = {
        input: inputs,
        output: {
            dir: outDir,
            format: "esm",
            sourcemap: true,
            intro: project === "cli" ? `const ADDER_LIST = [${adderNamesAsString}];` : undefined,
        },
        external: [/^@svelte-add.*/, "prettier", "create-svelte", "playwright", "npm-check-updates"],
        plugins: [
            preserveShebangs(),
            typescript({ project: "./tsconfig.json", outDir, rootDir: projectRoot, sourceRoot: projectRoot }),
            nodeResolve({ preferBuiltins: true }),
            commonjs(),
            json(),
            dynamicImportVars(),
        ],
    };

    return config;
}

const adderConfigs = [];
for (const adder of adderFolders) {
    adderConfigs.push(getConfig(adder, true));
}

export default [
    getConfig("ast-tooling", false),
    getConfig("ast-manipulation", false),
    getConfig("core", false),
    ...adderConfigs,
    getConfig("cli", false),
    getConfig("testing-library", false),
    getConfig("dev-utils", false),
];
