import { categories, defineAdderConfig, generateAdderInfo } from "@svelte-add/core";
import pkg from "../package.json";
import { options } from "./options.js";
import type { HtmlAstEditor, JsAstEditor } from "@svelte-add/core/adder/config.js";

export const adder = defineAdderConfig({
    metadata: {
        ...generateAdderInfo(pkg),
        name: "Bootstrap",
        description: "Build fast, responsive sites with Bootstrap",
        category: categories.css,
        environments: { kit: true, svelte: true },
        website: {
            logo: "./bootstrap.svg",
            keywords: ["bootstrap", "css", "sass", "scss"],
            documentation: "https://getbootstrap.com/docs/",
        },
    },
    options,
    integrationType: "inline",
    packages: [
        { name: "bootstrap", version: "^5.3.3", dev: true },
        { name: "@popperjs/core", version: "^2.11.8", dev: true, condition: ({ options }) => options.addJavaScript },
        { name: "sass", version: "^1.77.5", dev: true, condition: ({ options }) => options.useSass },
    ],
    files: [
        {
            name: () => "src/app.scss",
            contentType: "css",
            condition: ({ options }) => options.useSass,
            content: ({ ast, addAtRule, addComment, addDeclaration }) => {
                const baseImport = (component: string) => `"bootstrap/scss/${component}"`;
                const importRule = "import";

                addComment(ast, "1. Include functions first (so you can manipulate colors, SVGs, calc, etc)");
                addAtRule(ast, importRule, baseImport("functions"), true);

                addComment(ast, "2. Include any default variable overrides here");
                addDeclaration(ast, "$body-bg", "$background");

                addComment(
                    ast,
                    "3. Include remainder of required Bootstrap stylesheets (including any separate color mode stylesheets)",
                );
                addAtRule(ast, importRule, baseImport("variables"), true);
                addAtRule(ast, importRule, baseImport("variables-dark"), true);

                addComment(ast, "4. Include any default map overrides here");
                addComment(ast, "5. Include remainder of required parts");
                addAtRule(ast, importRule, baseImport("maps"), true);
                addAtRule(ast, importRule, baseImport("mixins"), true);
                addAtRule(ast, importRule, baseImport("root"), true);

                addComment(ast, "6. Optionally include any other parts as needed");
                addAtRule(ast, importRule, baseImport("utilities"), true);
                addAtRule(ast, importRule, baseImport("reboot"), true);
                addAtRule(ast, importRule, baseImport("type"), true);
                addAtRule(ast, importRule, baseImport("helpers"), true);
                addAtRule(ast, importRule, baseImport("buttons"), true);

                addComment(
                    ast,
                    "7. Optionally include utilities API last to generate classes based on the Sass map in `_utilities.scss`",
                );
                addAtRule(ast, importRule, baseImport("utilities/api"), true);

                addComment(ast, "Add additional custom code here");
            },
        },
        {
            name: () => "src/variables.scss",
            contentType: "css",
            condition: ({ options }) => options.useSass,
            content: ({ ast, addDeclaration, addComment }) => {
                addComment(ast, "Set your brand colors");
                addDeclaration(ast, "$background", "lightgrey");
            },
        },
        {
            name: () => "src/App.svelte",
            contentType: "svelte",
            condition: ({ kit }) => !kit.installed,
            content: ({ js, html, options }) => {
                if (options.useSass) {
                    js.imports.addEmpty(js.ast, "./app.scss");
                } else {
                    js.imports.addEmpty(js.ast, "bootstrap/dist/css/bootstrap.css");
                }

                if (options.addJavaScript) {
                    addBootstrapJavaScript(js, html, false);
                }
            },
        },
        {
            name: ({ kit }) => `${kit.routesDirectory}/+layout.svelte`,
            contentType: "svelte",
            condition: ({ kit }) => kit.installed,
            content: ({ js, options, html }) => {
                if (options.useSass) {
                    js.imports.addEmpty(js.ast, "../app.scss");
                } else {
                    js.imports.addEmpty(js.ast, "bootstrap/dist/css/bootstrap.css");
                }
                const slot = html.element("slot");
                html.ast.childNodes.push(slot);
            },
        },
        {
            name: ({ kit }) => `${kit.routesDirectory}/+layout.svelte`,
            contentType: "svelte",
            condition: ({ kit, options }) => kit.installed && options.addJavaScript,
            content: ({ js, html }) => {
                addBootstrapJavaScript(js, html, true);
            },
        },
        {
            name: ({ typescript }) => `vite.config.${typescript.installed ? "ts" : "js"}`,
            contentType: "script",
            condition: ({ options }) => options.useSass,
            content: ({ ast, object, common, functions, exports }) => {
                const { value: rootObject } = exports.defaultExport(ast, functions.call("defineConfig", []));
                const param1 = functions.argumentByIndex(rootObject, 0, object.createEmpty());

                const css = object.property(param1, "css", object.createEmpty());
                const preprocessorOptions = object.property(css, "preprocessorOptions", object.createEmpty());
                const scss = object.property(preprocessorOptions, "scss", object.createEmpty());
                const additionalData = object.property(scss, "additionalData", common.createLiteral());
                additionalData.value = `@use "src/variables.scss" as *;`;
            },
        },
    ],
    nextSteps: ({ options, cwd, colors, docs }) => {
        var steps = ["this is a test next step other", "cwd: " + cwd, "select sass: " + colors.green(options.useSass.toString())];

        if (docs) steps.push("docs: " + colors.cyan(docs));

        return steps;
    },
});

/**
 * Add a small JS snippet to support JS bootstrap components
 */
function addBootstrapJavaScript(js: JsAstEditor, html: HtmlAstEditor, isKit: boolean) {
    js.imports.addNamed(js.ast, "svelte", { onMount: "onMount" });
    if (isKit) {
        js.imports.addNamed(js.ast, "$app/environment", { browser: "browser" });
    }

    // the overall method call
    const onMountCaller = js.functions.call("onMount", []);
    const onMountExpression = js.common.expressionStatement(onMountCaller);
    js.ast.body.push(onMountExpression);

    // the first parameter
    const methodBody = js.common.blockStatement();
    const onMountBody = js.functions.arrowFunction(true, methodBody);
    onMountCaller.arguments.push(onMountBody);

    // the body of the arrow function
    const methodBodyString = `
    ${isKit ? "if (!browser) return;\n" : ""}
    // this is enough for most components
    await import("bootstrap");

    // some components require a bootstrap instance, to fulfil their job. In that case, use this:
    // const bootstrap = await import("bootstrap");
    // sample usage: 
    // const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample)`;
    js.common.addFromString(methodBody, methodBodyString);

    if (isKit) {
        const slot = html.element("slot");
        html.ast.childNodes.push(slot);
    }
}
