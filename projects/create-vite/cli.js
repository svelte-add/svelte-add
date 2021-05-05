import { getChoices } from "svelte-add";

const main = async () => {
    console.error("creating a vite-powered svelte app like this doesn't work yet");

    const choices = await getChoices({
        args: process.argv.slice(2),
        promptMissing: true,
    });

    // TODO: make proper use of choices
    console.log({ choices });
};

main();
