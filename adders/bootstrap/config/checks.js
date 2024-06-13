import { defineAdderChecks } from "@svelte-add/core";
import { options } from "./options";

export const checks = defineAdderChecks({
    options,
    postconditions: [
        {
            name: "scss setup",
            run: async ({ fileExists, fileContains }) => {
                if (options.useSass) {
                    const filePath = `src/variables.scss`;
                    await fileExists(filePath);
                    await fileContains(filePath, "$background: lightgrey;");
                }
            },
        },
    ],
});
