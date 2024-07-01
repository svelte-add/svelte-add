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
        {
            name: "eslint-config-prettier",
            version: "^9.1.0",
            dev: true,
            condition: ({ dependencies }) => hasEslint(dependencies),
        },
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
            content: ({ data, dependencies }) => {
                data.scripts ??= {};
                const scripts: Record<string, string> = data.scripts;
                const CHECK_CMD = "prettier --check .";
                scripts["format"] ??= "prettier --write .";
                scripts["format:check"] ??= CHECK_CMD;

                if (hasEslint(dependencies)) {
                    scripts["lint"] ??= `${CHECK_CMD} && eslint .`;
                    if (!scripts["lint"].includes(CHECK_CMD)) scripts["lint"] += ` && ${CHECK_CMD}`;
                }
            },
        },
        {
            name: () => "eslint.config.js",
            contentType: "script",
            condition: ({ dependencies }) => hasEslint(dependencies),
            content: ({ ast, imports, exports, common }) => {
                // TODO: maybe this could be more intelligent and we can detect the name of the default import?
                imports.addDefault(ast, "eslint-plugin-svelte", "svelte");
                imports.addDefault(ast, "eslint-config-prettier", "prettier");

                const fallbackConfig = common.expressionFromString("[]");
                const defaultExport = exports.defaultExport(ast, fallbackConfig);
                const array = defaultExport.value;
                if (array.type !== "ArrayExpression") return;

                const prettier = common.expressionFromString("prettier");
                const sveltePrettierConfig = common.expressionFromString("svelte.configs['flat/prettier']");
                const configSpread = common.createSpreadElement(sveltePrettierConfig);

                const nodesToInsert = [];
                if (!common.hasNode(array, prettier)) nodesToInsert.push(prettier);
                if (!common.hasNode(array, configSpread)) nodesToInsert.push(configSpread);

                // finds index of `...svelte.configs["..."]`
                const idx = array.elements.findIndex(
                    (el) =>
                        el?.type === "SpreadElement" &&
                        el.argument.type === "MemberExpression" &&
                        el.argument.object.type === "MemberExpression" &&
                        el.argument.object.property.type === "Identifier" &&
                        el.argument.object.property.name === "configs" &&
                        el.argument.object.object.type === "Identifier" &&
                        el.argument.object.object.name === "svelte",
                );

                if (idx !== -1) {
                    array.elements.splice(idx + 1, 0, ...nodesToInsert);
                } else {
                    // append to the end as a fallback
                    array.elements.push(...nodesToInsert);
                }
            },
        },
    ],
});

function hasEslint(deps: Record<string, string>): boolean {
    return !!deps["eslint"] && deps["eslint"].startsWith("9");
}
