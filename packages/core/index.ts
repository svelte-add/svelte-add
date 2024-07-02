import { defineAdderConfig, defineAdderTests, defineAdder, defineAdderOptions, defineAdderChecks } from "./adder/config.js";
import { executeCli } from "./utils/cli.js";
import { log } from "@svelte-add/clack-prompts";
import * as colors from "picocolors";
import dedent from "dedent";

export {
    defineAdderConfig,
    defineAdder,
    defineAdderTests,
    defineAdderOptions,
    defineAdderChecks,
    executeCli,
    dedent,
    log,
    colors,
};
