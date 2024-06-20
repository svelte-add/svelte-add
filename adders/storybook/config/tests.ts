import { defineAdderTests } from "@svelte-add/core";
import { options } from "./options.js";

export const tests = defineAdderTests({
    options,
    optionValues: [],
    // If you run multiple of these tests in parallel, most of the times randomly one test
    // will fail while executing some npx command with an exit code of 7.
    // In order to get consistent results, we execute those tests one after the other.
    runSynchronously: true,
    command: "storybook",
    files: [],
    tests: [
        {
            name: "storybook loaded",
            run: async ({ elementExists }) => {
                await elementExists("main .sb-bar");
                await elementExists("#storybook-preview-wrapper");
            },
        },
    ],
});
