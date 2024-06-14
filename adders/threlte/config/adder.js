import { categories, defineAdderConfig, generateAdderInfo } from "@svelte-add/core";
import pkg from "../package.json";
import { options } from "./options.js";

export const adder = defineAdderConfig({
    metadata: {
        ...generateAdderInfo(pkg),
        name: "Threlte",
        description: "Rapidly build interactive 3D apps for the web.",
        category: categories.tools,
        environments: { svelte: true, kit: true },
        website: {
            logo: "./threlte.svg",
            keywords: ["threlte", "3d", "3d apps"],
            documentation: "https://threlte.xyz/docs/learn/getting-started/installation",
        },
    },
    options,
    integrationType: "inline",
    packages: [
        { name: "three", version: "^0.165.0", dev: false },
        { name: "@threlte/core", version: "^7.3.0", dev: false },
    ],
    files: [
        {
            name: ({ typescript }) => `vite.config.${typescript.installed ? "ts" : "js"}`,
            contentType: "script",
            content: ({ ast, array, object, exports, functions }) => {
                const { value: rootExport } = exports.defaultExport(ast, functions.call("defineConfig", []));
                const firstParam = functions.argumentByIndex(rootExport, 0, object.createEmpty());

                const ssr = object.property(firstParam, "ssr", object.createEmpty());
                const noExternalArray = object.property(ssr, "noExternal", array.createEmpty());
                array.push(noExternalArray, "three");
            },
        },
        {
            name: () => `tsconfig.json`,
            contentType: "json",
            condition: ({ typescript }) => typescript.installed,
            content: ({ data }) => {
                if (!data.compilerOptions) data.compilerOptions = {};

                if (data.compilerOptions.moduleResolution.toLowerCase() !== "bundler") {
                    data.compilerOptions.moduleResolution = "bundler";
                }
            },
        },
        {
            name: () => "src/App.svelte",
            contentType: "svelte",
            condition: ({ kit, options }) => !kit.installed && options.addDemo,
            content: ({ js, html, kit }) => {
                addDemoSceneUsage(js, html, kit.installed);
            },
        },
        {
            name: ({ kit }) => `${kit.routesDirectory}/+page.svelte`,
            contentType: "svelte",
            condition: ({ kit, options }) => kit.installed && options.addDemo,
            content: ({ js, html, kit }) => {
                addDemoSceneUsage(js, html, kit.installed);
            },
        },
        {
            name: () => "src/Scene.svelte",
            contentType: "svelte",
            condition: ({ kit, options }) => !kit.installed && options.addDemo,
            content: ({ js, html }) => {
                addDemoScene(js, html);
            },
        },
        {
            name: ({ kit }) => `${kit.libDirectory}/Scene.svelte`,
            contentType: "svelte",
            condition: ({ kit, options }) => kit.installed && options.addDemo,
            content: ({ js, html }) => {
                addDemoScene(js, html);
            },
        },
    ],
});

/**
 * Add a small JS snippet to support JS bootstrap components
 * @param {import("@svelte-add/core/adder/config.js").JsAstEditor} js
 * @param {import("@svelte-add/core/adder/config.js").HtmlAstEditor} html
 */
function addDemoScene(js, html) {
    js.imports.addNamed(js.ast, "@threlte/core", { T: "T" });

    const htmlString = `
<T.Mesh position.y="{1}">
    <T.BoxGeometry args="{[1, 2, 1]}" />
    <T.MeshBasicMaterial color="pink" />
</T.Mesh>`;
    html.addFromRawHtml(html.ast.childNodes, htmlString);
}

/**
 * Add a small JS snippet to support JS bootstrap components
 * @param {import("@svelte-add/core/adder/config.js").JsAstEditor} js
 * @param {import("@svelte-add/core/adder/config.js").HtmlAstEditor} html
 * @param {boolean} isKit
 */
function addDemoSceneUsage(js, html, isKit) {
    js.imports.addNamed(js.ast, "@threlte/core", { Canvas: "Canvas" });
    if (isKit) {
        js.imports.addDefault(js.ast, "$lib/Scene.svelte", "Scene");
    } else {
        js.imports.addDefault(js.ast, "./Scene.svelte", "Scene");
    }

    const div = html.div();
    html.insertElement(html.ast.childNodes, div);

    const canvas = html.element("Canvas");
    html.insertElement(div.childNodes, canvas);
    const scene = html.element("Scene");
    html.appendElement(canvas.childNodes, scene);
}
