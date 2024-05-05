import { defineAdderOptions } from "@svelte-add/core";

export const options = defineAdderOptions({
    useSass: {
        question: "Do you want to use sass? (css = faster, sass = better customization)",
        type: "boolean",
        default: false,
    },
    addJavaScript: {
        question: "Do you want to add JavaScript (required for some components like dropdowns)?",
        type: "boolean",
        default: false,
    },
});
