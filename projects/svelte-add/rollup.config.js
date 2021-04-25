import { builtinModules } from "module";
import dynamicImportVars from "@rollup/plugin-dynamic-import-vars";
import pkg from "./package.json";

/** @type{import("rollup").RollupOptions} */
const config = {
    external: [...builtinModules, ...Object.keys(pkg.dependencies ?? {})],
    input: "cli.js",
    output: {
        banner: "#!/usr/bin/env node",
        file: "cli.cjs",
        format: "cjs",
        inlineDynamicImports: true,
    },
    plugins: [
        dynamicImportVars(),
    ]
};

/** @type{import("rollup").RollupOptions} */
export default config;
