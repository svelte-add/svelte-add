#!/usr/bin/env node
const { logger } = require("@poppinss/cliui");

let [node, index, adder, ...args] = process.argv;

if (!adder) {
    logger.error(`No adder was specified. Read ${logger.colors.cyan("https://github.com/svelte-add/svelte-adders")} to see available adders and usage.`);
    process.exit(0);
}

if (!adder.includes("/")) adder = `svelte-add/${adder}`;
if (!args.includes("--no-ssh")) args = [...args, "--no-ssh"];

process.argv = [node, index, adder, ...args];

require("apply/bin/run");
