import { defineAdderOptions } from "@svelte-add/core";

export const options = defineAdderOptions({
    addDemo: {
        question: "Should we add a minimalistic demo?",
        type: "boolean",
        default: false,
    },
});
