import { defineAdderConfig, defineAdderTests, defineAdder, defineAdderOptions, defineAdderChecks } from "./adder/config.js";
import { generateAdderInfo } from "./adder/execute.js";
import { executeCli } from "./utils/common.js";
import dedent from "dedent";

export {
    defineAdderConfig,
    generateAdderInfo,
    defineAdder,
    defineAdderTests,
    defineAdderOptions,
    defineAdderChecks,
    executeCli,
    dedent,
};
