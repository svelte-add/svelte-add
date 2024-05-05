import { defineAdderTests } from "@svelte-add/core";
import { options } from "./options";

const divId = "myDiv";
const typographyDivId = "myTypographyDiv";

export const tests = defineAdderTests({
    files: [
        {
            name: ({ kit }) => `${kit.routesDirectory}/+page.svelte`,
            contentType: "svelte",
            content: (editor) => {
                prepareCoreTest(editor);
                if (editor.options.typography) prepareTypographyTest(editor);
            },
            condition: ({ kit }) => kit.installed,
        },
        {
            name: () => `src/App.svelte`,
            contentType: "svelte",
            content: (editor) => {
                prepareCoreTest(editor);
                if (editor.options.typography) prepareTypographyTest(editor);
            },
            condition: ({ kit }) => !kit.installed,
        },
    ],
    options,
    optionValues: [{ typography: false }, { typography: true }],
    tests: [
        {
            name: "core properties",
            run: async ({ expectProperty }) => {
                const selector = "#" + divId;
                await expectProperty(selector, "background-color", "rgb(71, 85, 105)");
                await expectProperty(selector, "border-color", "rgb(249, 250, 251)");
                await expectProperty(selector, "border-width", "4px");
                await expectProperty(selector, "margin-top", "4px");
            },
        },
        {
            name: "typography properties",
            condition: ({ typography }) => typography,
            run: async ({ expectProperty }) => {
                const selector = "#" + typographyDivId;
                await expectProperty(selector, "font-size", "18px");
                await expectProperty(selector, "line-height", "28px");
                await expectProperty(selector, "text-align", "right");
                await expectProperty(selector, "text-decoration-line", "line-through");
            },
        },
    ],
});

/**
 * @template {import("@svelte-add/core/adder/options.js").OptionDefinition} Args
 * @param {import("@svelte-add/core/files/processors.js").SvelteFileEditorArgs<Args>} editor
 */
function prepareCoreTest({ html }) {
    const div = html.div({ class: "bg-slate-600 border-gray-50 border-4 mt-1", id: divId });
    html.appendElement(html.ast.childNodes, div);
}

/**
 * @template {import("@svelte-add/core/adder/options.js").OptionDefinition} Args
 * @param {import("@svelte-add/core/files/processors.js").SvelteFileEditorArgs<Args>} editor
 */
function prepareTypographyTest({ html }) {
    const div = html.element("p", { class: "text-lg text-right line-through", id: typographyDivId });
    html.appendElement(html.ast.childNodes, div);
}
