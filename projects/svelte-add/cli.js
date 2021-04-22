import { logger } from "@poppinss/cliui";

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

const main = async () => {
    const run = await import(`./modules/${adder}/run.js`);

    if (run.compatibility) {
        const { applyPreset } = await import("./compatibility.js");
        applyPreset({ args, preset: run.compatibility, index, node });
    }
}

main();
