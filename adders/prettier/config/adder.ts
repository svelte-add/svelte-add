import { dedent, defineAdderConfig } from "@svelte-add/core";
import { options } from "./options";

export const adder = defineAdderConfig({
    metadata: {
        id: "prettier",
        name: "Prettier",
        description: "An opinionated code formatter",
        environments: { svelte: true, kit: true },
        website: {
            logo: "./prettier.svg",
            keywords: ["prettier", "code", "formatter", "formatting"],
            documentation: "https://prettier.io/docs/en/",
        },
    },
    options,
    integrationType: "inline",
    packages: [
        { name: "prettier", version: "^3.1.1", dev: true },
        { name: "prettier-plugin-svelte", version: "^3.1.2", dev: true },
    ],
    files: [
        {
            name: () => `.prettierrc`,
            contentType: "text",
            content: () => {
                return dedent`
                {
                    "useTabs": true,
                    "singleQuote": true,
                    "trailingComma": "none",
                    "printWidth": 100,
                    "plugins": ["prettier-plugin-svelte"],
                    "overrides": [{ "files": "*.svelte", "options": { "parser": "svelte" } }]
                }`;
            },
        },
        {
            name: () => `.prettierignore`,
            contentType: "text",
            content: () => {
                return dedent`
                # Package Managers
                package-lock.json
                pnpm-lock.yaml
                yarn.lock`;
            },
        },
        {
            name: () => `package.json`,
            contentType: "json",
            content: ({ data }) => {
                if (!data.scripts) data.scripts = {};

                data.scripts.lint = "pnpm prettier . --check";
            },
        },
    ],
});
