import colors from "kleur";

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

const main = async () => {
    const [node, index, adder, ...args] = process.argv;

    if (!adder) {
        // TODO: show the interactive menus instead
        console.error(`${colors.red("No adder was specified.")}\nRead ${colors.cyan("https://github.com/svelte-add/svelte-add")} to see available adders and usage.`);
        process.exit(0);
    }
    
    const run = await import(`./modules/${adder}/run.js`);

    if (run.compatibility) {
        const { applyPreset } = await import("./compatibility.js");
        applyPreset({ args, preset: run.compatibility, index, node });
    }
}

main();
