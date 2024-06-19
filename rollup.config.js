import fs from "node:fs";
import path from "node:path";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import dynamicImportVars from "@rollup/plugin-dynamic-import-vars";
import { preserveShebangs } from "rollup-plugin-preserve-shebangs";
import esbuild from "rollup-plugin-esbuild";
import dts from "rollup-plugin-dts";

const adderFolders = fs
    .readdirSync("./adders/", { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item) => item.name);
const adderNamesAsString = adderFolders.map((x) => `"${x}"`);

/** @type {import("rollup").RollupOptions[]} */
const dtsConfigs = [];

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
        inputs.push(`./adders/${project}/index.ts`);

        outDir = `./adders/${project}/build`;
    }

    const projectRoot = path.resolve(path.join(outDir, ".."));
    fs.rmSync(outDir, { force: true, recursive: true });

    /** @type {import("./packages/core/utils/common.js").Package} */
    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"));
    // any dep under `dependencies` is considered external
    const externalDeps = Object.keys(pkg.dependencies ?? {});

    const intro = project === "cli" ? `const ADDER_LIST = [${adderNamesAsString.join(",")}];` : undefined;
    const external = [/^@?svelte-add/, ...externalDeps];

    /** @type {import("rollup").RollupOptions} */
    const config = {
        input: inputs,
        output: {
            dir: outDir,
            format: "esm",
            sourcemap: true,
            intro,
        },
        external,
        plugins: [
            preserveShebangs(),
            esbuild({ tsconfig: "tsconfig.json", sourceRoot: projectRoot }),
            nodeResolve({ preferBuiltins: true, rootDir: projectRoot }),
            commonjs(),
            json(),
            dynamicImportVars(),
        ],
    };

    // only generate dts files for libs
    if ("exports" in pkg) {
        dtsConfigs.push({
            input: inputs,
            output: {
                dir: outDir,
                intro,
            },
            external,
            plugins: [dts()],
        });
    }

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
    ...dtsConfigs,
];
