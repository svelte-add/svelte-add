import { builtinModules } from "module";
import pkg from "./package.json";

/** @type {import("rollup").RollupOptions} */
const config = {
    external: [...builtinModules, ...Object.keys(pkg.dependencies ?? {})],
    input: "cli.js",
    output: {
        banner: "#!/usr/bin/env node",
        file: "cli.cjs",
        format: "cjs",
    },
};

export default config;
