import { categories, defineAdderConfig, generateAdderInfo } from "@svelte-add/core";
import pkg from "../package.json";
import { options } from "./options.js";

export const adder = defineAdderConfig({
    metadata: {
        ...generateAdderInfo(pkg),
        name: "Storybook",
        description: "Frontend workshop for building UI components in isolation",
        category: categories.tools,
        environments: { kit: true, svelte: true },
        website: {
            logo: "./storybook.svg",
            keywords: ["storybook", "styling", "testing", "documentation", "storybook-svelte-csf", "svelte-csf"],
            documentation: "https://storybook.js.org/docs/get-started",
        },
    },

    options,
    integrationType: "external",
    command: "storybook@next init --skip-install",
});
