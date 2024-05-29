import { defineAdderOptions } from "@svelte-add/core";

export const options = defineAdderOptions({
    database: {
        question: "Which database would you like to use?",
        default: "sqlite",
        type: "select",
        options: [{ value: "sqlite" }, { value: "mysql" }, { value: "postgresql" }],
    },
});
