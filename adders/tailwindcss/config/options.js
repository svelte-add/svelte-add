import { defineAdderOptions } from "@svelte-add/core";

export const options = defineAdderOptions({
    typography: {
        question: "Do you want to use typography plugin?",
        default: false,
        type: "boolean",
    },
});
