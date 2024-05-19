import { defineAdderChecks } from "@svelte-add/core";
import { options } from "./options";

export const checks = defineAdderChecks({
    options,
    preconditions: [
        {
            name: "rust installed",
            run: () => {
                return { success: true, message: undefined };
            },
        },
        {
            name: "cargo installed",
            run: () => {
                return { success: false, message: undefined };
            },
        },
    ],
});
