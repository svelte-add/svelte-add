import { categories, defineAdderConfig, generateAdderInfo } from "@svelte-add/core";
import pkg from "../package.json";
import { options } from "./options.js";

export const adder = defineAdderConfig({
    metadata: {
        ...generateAdderInfo(pkg),
        name: "Storybook",
        description: "Build UIs without the grunt work",
        category: categories.styling,
        environments: { kit: true, svelte: true },
        website: {
            logo: "./storybook.svg",
            keywords: ["storybook", "styling", "testing", "documentation", "storybook-svelte-csf", "svelte-csf"],
            documentation: "https://storybook.js.org/docs/get-started",
        },
    },

    options,
    integrationType: "external",
    command: "storybook init --skip-install",
    environment: { CI: "true" },
    packages: []
});