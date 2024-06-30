import { dedent, defineAdderConfig } from "@svelte-add/core";
import { options } from "./options.js";

export const adder = defineAdderConfig({
    metadata: {
        id: "prettier",
        name: "Prettier",
        description: "An opinionated code formatter",
        environments: { svelte: true, kit: true },
        website: {
            logo: "./prettier.svg",
            keywords: ["prettier", "code", "formatter", "formatting"],
            documentation: "https://prettier.io",
        },
    },
    options,
    integrationType: "inline",
    packages: [
        { name: "prettier", version: "^3.3.2", dev: true },
        { name: "prettier-plugin-svelte", version: "^3.2.5", dev: true },
    ],
    files: [
        {
            name: () => `.prettierignore`,
            contentType: "text",
            content: ({ content }) => {
                if (content) return content;
                return dedent`
                    # Package Managers
                    package-lock.json
                    pnpm-lock.yaml
                    yarn.lock
                `;
            },
        },
        {
            name: () => ".prettierrc",
            contentType: "json",
            content: ({ data }) => {
                data.useTabs ??= true;
                data.singleQuote ??= true;
                data.trailingComma ??= "none";
                data.printWidth ??= 100;
                data.plugins ??= [];
                data.overrides ??= [];

                const plugins: string[] = data.plugins;
                if (!plugins.includes("prettier-plugin-svelte")) {
                    data.plugins.unshift("prettier-plugin-svelte");
                }

                const overrides: { files: string | string[]; options?: { parser?: string } }[] = data.overrides;
                const override = overrides.find((o) => o?.options?.parser === "svelte");
                if (!override) {
                    overrides.push({ files: "*.svelte", options: { parser: "svelte" } });
                }
            },
        },
        {
            name: () => "package.json",
            contentType: "json",
            content: ({ data }) => {
                data.scripts ??= {};
                const scripts: Record<string, string> = data.scripts;
                scripts["format"] ??= "prettier --write .";
                scripts["format:check"] ??= "prettier --check .";
            },
        },
    ],
});
