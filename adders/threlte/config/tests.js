import { defineAdderTests } from "@svelte-add/core";
import { options } from "./options.js";

export const tests = defineAdderTests({
    files: [],
    options,
    optionValues: [{ addDemo: true }],
    tests: [
        {
            name: "canvas exists",
            run: async ({ elementExists, expectProperty }) => {
                await elementExists("canvas");
                await expectProperty("canvas", "height", "150px");
            },
        },
    ],
});
