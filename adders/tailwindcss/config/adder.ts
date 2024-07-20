import { defineAdderConfig } from "@svelte-add/core";
import { options } from "./options";

export const adder = defineAdderConfig({
    metadata: {
        id: "tailwindcss",
        name: "Tailwind CSS",
        description: "Rapidly build modern websites without ever leaving your HTML",
        environments: { svelte: true, kit: true },
        website: {
            logo: "./tailwindcss.svg",
            keywords: ["tailwind", "postcss", "autoprefixer"],
            documentation: "https://tailwindcss.com/docs",
        },
    },
    options,
    integrationType: "inline",
    packages: [
        { name: "tailwindcss", version: "^3.4.4", dev: true },
        { name: "postcss", version: "^8.4.38", dev: true },
        { name: "autoprefixer", version: "^10.4.19", dev: true },
        { name: "@tailwindcss/typography", version: "^0.5.13", dev: true, condition: ({ options }) => options.typography },
        {
            name: "prettier-plugin-tailwindcss",
            version: "^0.6.4",
            dev: true,
            condition: ({ prettier }) => prettier.installed,
        },
    ],
    files: [
        {
            name: ({ typescript }) => `tailwind.config.${typescript.installed ? "ts" : "js"}`,
            contentType: "script",
            content: ({ options, ast, array, object, common, functions, exports, typescript, imports }) => {
                let root;
                const rootExport = object.createEmpty();
                if (typescript.installed) {
                    imports.addNamed(ast, "tailwindcss", { Config: "Config" }, true);
                    root = common.typeAnnotateExpression(rootExport, "Config");
                }

                const { astNode: exportDeclaration } = exports.defaultExport(ast, root ?? rootExport);

                if (!typescript.installed) common.addJsDocTypeComment(exportDeclaration, "import('tailwindcss').Config");

                const contentArray = object.property(rootExport, "content", array.createEmpty());
                array.push(contentArray, "./src/**/*.{html,js,svelte,ts}");

                const themeObject = object.property(rootExport, "theme", object.createEmpty());
                object.property(themeObject, "extend", object.createEmpty());

                const pluginsArray = object.property(rootExport, "plugins", array.createEmpty());

                if (options.typography) {
                    const requireCall = functions.call("require", ["@tailwindcss/typography"]);
                    array.push(pluginsArray, requireCall);
                }
            },
        },
        {
            name: () => "postcss.config.js",
            contentType: "script",
            content: ({ ast, object, exports }) => {
                const { value: rootObject } = exports.defaultExport(ast, object.createEmpty());
                const pluginsObject = object.property(rootObject, "plugins", object.createEmpty());

                object.property(pluginsObject, "tailwindcss", object.createEmpty());
                object.property(pluginsObject, "autoprefixer", object.createEmpty());
            },
        },
        {
            name: () => "src/app.css",
            contentType: "css",
            content: ({ ast, addAtRule }) => {
                const imports = ['"tailwindcss/utilities"', '"tailwindcss/components"', '"tailwindcss/base"'];
                const firstNode = ast.first;
                const nodes = imports.map((name) => addAtRule(ast, "import", name));

                if (firstNode !== ast.first && firstNode?.type === "atrule" && firstNode.name === "import") {
                    firstNode.raws.before = "\n";
                }

                nodes.forEach((n, i) => {
                    // prevents a new line being added at the top of the stylesheet
                    if (i !== nodes.length - 1) n.raws.before = "\n";
                });
            },
        },
        {
            name: () => "src/App.svelte",
            contentType: "svelte",
            content: ({ js }) => {
                js.imports.addEmpty(js.ast, "./app.css");
            },
            condition: ({ kit }) => !kit.installed,
        },
        {
            name: ({ kit }) => `${kit.routesDirectory}/+layout.svelte`,
            contentType: "svelte",
            content: ({ js, html }) => {
                js.imports.addEmpty(js.ast, "../app.css");
                if (html.ast.childNodes.length === 0) {
                    const slot = html.element("slot");
                    html.ast.childNodes.push(slot);
                }
            },
            condition: ({ kit }) => kit.installed,
        },
        {
            name: () => ".prettierrc",
            contentType: "json",
            content: ({ data }) => {
                if (!data.plugins) data.plugins = [];

                data.plugins.push("prettier-plugin-tailwindcss");
            },
            condition: ({ prettier }) => prettier.installed,
        },
    ],
});
