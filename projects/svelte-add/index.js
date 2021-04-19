#!/usr/bin/env node
const { logger } = require("@poppinss/cliui");

const [node, index, adder, ...args] = process.argv;


const css = [
    ["postcss", ["tailwindcss"]],
    ["scss", ["bulma"]],
];

const other = [
    ["graphql-server", []],
    ["mdsvex", []],
]

const deploy = [
    ["firebase-hosting", []],
];

if (!adder) {
    // TODO: show the interactive menus instead
    logger.error(`No adder was specified. Read ${logger.colors.cyan("https://github.com/svelte-add/svelte-add")} to see available adders and usage.`);
    process.exit(0);
}

const { applyPreset } = require("./compatibility");
applyPreset({ args, adder, index, node });
