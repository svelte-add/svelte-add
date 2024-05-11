import { categories, defineAdderConfig, generateAdderInfo } from "@svelte-add/core";
import pkg from "../package.json";
import { options } from "./options";

export const adder = defineAdderConfig({
    metadata: {
        ...generateAdderInfo(pkg),
        name: "TailwindCSS",
        description: "Rapidly build modern websites without ever leaving your HTML.",
        category: categories.styling,
        environments: { svelte: true, kit: true },
        website: {
            logo: "./tailwindcss.svg",
            keywords: ["tailwind", "postcss", "autoprefixer"],
            documentation: "https://tailwindcss.com/docs/",
        },
    },
    options,
    integrationType: "inline",
    packages: [
        { name: "tailwindcss", version: "^3.4.1", dev: true },
        { name: "postcss", version: "^8.4.33", dev: true },
        { name: "autoprefixer", version: "^10.4.16", dev: true },
        { name: "@tailwindcss/typography", version: "^0.5.10", dev: true, condition: ({ options }) => options.typography },
        {
            name: "prettier-plugin-tailwindcss",
            version: "^0.5.1",
            dev: true,
            condition: ({ prettier }) => prettier.installed,
        },
    ],
    files: [
        {
            name: ({ typescript }) => `tailwind.config.${typescript.installed ? "ts" : "js"}`,
            contentType: "script",
            content: ({ options, ast, array, object, common, functions, exports }) => {
                const { astNode: exportDeclaration, value: rootExport } = exports.defaultExport(ast, object.createEmpty());

                common.addJsDocTypeComment(exportDeclaration, "import('tailwindcss').Config");

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
                const atRules = ["utilities", "components", "base"];
                for (const name of atRules) {
                    addAtRule(ast, "tailwind", name);
                }
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
                const slot = html.element("slot");
                html.ast.childNodes.push(slot);
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
