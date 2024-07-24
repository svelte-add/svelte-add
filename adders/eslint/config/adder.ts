import { defineAdderConfig } from "@svelte-add/core";
import { options } from "./options.js";

export const adder = defineAdderConfig({
    metadata: {
        id: "eslint",
        name: "ESLint",
        description: "A configurable JavaScript linter",
        environments: { svelte: true, kit: true },
        website: {
            logo: "./eslint.svg",
            keywords: ["eslint", "code", "linter"],
            documentation: "https://eslint.org/",
        },
    },
    options,
    integrationType: "inline",
    packages: [
        { name: "eslint", version: "^9.7.0", dev: true },
        { name: "@types/eslint", version: "^9.6.0", dev: true },
        { name: "globals", version: "^15.0.0", dev: true },
        { name: "typescript-eslint", version: "^8.0.0-alpha.20", dev: true, condition: ({ typescript }) => typescript.installed },
        { name: "eslint-plugin-svelte", version: "^2.36.0", dev: true },
        {
            name: "eslint-config-prettier",
            version: "^9.1.0",
            dev: true,
            condition: ({ prettier }) => prettier.installed,
        },
    ],
    files: [
        {
            name: () => "package.json",
            contentType: "json",
            content: ({ data }) => {
                data.scripts ??= {};
                const scripts: Record<string, string> = data.scripts;
                const LINT_CMD = "eslint .";
                scripts["lint"] ??= LINT_CMD;
                if (!scripts["lint"].includes(LINT_CMD)) scripts["lint"] += ` && ${LINT_CMD}`;
            },
        },
        {
            name: () => "eslint.config.js",
            contentType: "script",
            content: ({ ast, imports, exports, common, typescript, prettier, array, variables, object }) => {
                // imports
                if (prettier.installed) imports.addDefault(ast, "eslint-config-prettier", "prettier");
                if (typescript.installed) imports.addDefault(ast, "typescript-eslint", "ts");
                imports.addDefault(ast, "globals", "globals");
                imports.addDefault(ast, "eslint-plugin-svelte", "svelte");
                imports.addDefault(ast, "@eslint/js", "js");

                const fallbackConfig = array.createEmpty();
                const defaultExport = exports.defaultExport(ast, fallbackConfig);
                const eslintConfigs = defaultExport.value;
                if (eslintConfigs.type !== "ArrayExpression") return;

                common.addJsDocTypeComment(defaultExport.astNode, "import('eslint').Linter.Config[]");

                const jsConfig = common.expressionFromString("js.configs.recommended");
                array.push(eslintConfigs, jsConfig);

                if (typescript.installed) {
                    const tsConfig = common.expressionFromString("ts.configs.recommended");
                    array.push(eslintConfigs, common.createSpreadElement(tsConfig));
                }

                const svelteConfig = common.expressionFromString('svelte.configs["flat/recommended"]');
                array.push(eslintConfigs, common.createSpreadElement(svelteConfig));

                if (prettier.installed) {
                    const prettierConfig = variables.identifier("prettier");
                    array.push(eslintConfigs, prettierConfig);

                    const sveltePrettierConfig = common.expressionFromString('svelte.configs["flat/prettier"]');
                    array.push(eslintConfigs, common.createSpreadElement(sveltePrettierConfig));
                }

                const globalsBrowser = common.createSpreadElement(common.expressionFromString("globals.browser"));
                const globalsNode = common.createSpreadElement(common.expressionFromString("globals.node"));
                const globalsObjLiteral = object.createEmpty();
                globalsObjLiteral.properties = [globalsBrowser, globalsNode];
                const globalsConfig = object.create({
                    languageOptions: object.create({
                        globals: globalsObjLiteral,
                    }),
                });
                array.push(eslintConfigs, globalsConfig);

                if (typescript.installed) {
                    const svelteTSParserConfig = object.create({
                        files: common.expressionFromString('["**/*.svelte"]'),
                        languageOptions: object.create({
                            parserOptions: object.create({
                                parser: common.expressionFromString("ts.parser"),
                            }),
                        }),
                    });
                    array.push(eslintConfigs, svelteTSParserConfig);
                }

                const ignoresConfig = object.create({
                    ignores: common.expressionFromString('["build/", ".svelte-kit/", "dist/"]'),
                });
                array.push(eslintConfigs, ignoresConfig);
            },
        },
    ],
});
