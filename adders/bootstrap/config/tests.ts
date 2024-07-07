import { defineAdderTests } from "@svelte-add/core";
import { options } from "./options.js";
import type { HtmlAstEditor } from "@svelte-add/core/adder/config.js";

export const tests = defineAdderTests({
    options,
    optionValues: [
        { useSass: false, addJavaScript: true },
        { useSass: true, addJavaScript: true },
    ],
    files: [
        {
            name: ({ kit }) => `${kit.routesDirectory}/+page.svelte`,
            contentType: "svelte",
            condition: ({ kit }) => kit.installed,
            content: ({ html, options }) => {
                prepareButtonTest(html);
                prepareTypographyTest(html);

                if (options.addJavaScript) {
                    prepareDropdownTest(html);
                }
            },
        },
        {
            name: () => `src/App.svelte`,
            contentType: "svelte",
            condition: ({ kit }) => !kit.installed,
            content: ({ html, options }) => {
                prepareButtonTest(html);
                prepareTypographyTest(html);

                if (options.addJavaScript) {
                    prepareDropdownTest(html);
                }
            },
        },
    ],
    tests: [
        {
            name: "button properties",
            run: async ({ expectProperty }) => {
                await expectProperty(".btn.btn-primary", "background-color", "rgb(13, 110, 253)");
                await expectProperty(".btn.btn-primary", "padding-top", "6px");
                await expectProperty(".btn.btn-primary", "padding-left", "12px");

                await expectProperty(".btn.btn-success", "background-color", "rgb(25, 135, 84)");
                await expectProperty(".btn.btn-success", "padding-top", "6px");
                await expectProperty(".btn.btn-success", "padding-left", "12px");
            },
        },
        {
            name: "typography properties",
            run: async ({ expectProperty }) => {
                await expectProperty(".h1", "font-size", "40px");
                await expectProperty(".text-decoration-line-through", "text-decoration", "line-through solid rgb(33, 37, 41)");
            },
        },
        {
            name: "dropdown properties",
            run: async ({ click, elementExists }) => {
                await click(".btn.dropdown-toggle");
                await elementExists(".btn.dropdown-toggle.show");
            },
        },
    ],
});

function prepareButtonTest({ ast, addFromRawHtml }: HtmlAstEditor) {
    const buttonHtml = `
<button class="btn btn-primary">Test</button>
<button class="btn btn-success">Test</button>
`;

    addFromRawHtml(ast.childNodes, buttonHtml);
}

function prepareTypographyTest({ ast, addFromRawHtml }: HtmlAstEditor) {
    const typographyHtml = `
<p class="h1">Test</p>
<p class="text-decoration-line-through">Test</p>
`;
    addFromRawHtml(ast.childNodes, typographyHtml);
}

function prepareDropdownTest({ ast, addFromRawHtml }: HtmlAstEditor) {
    const typographyHtml = `
<div class="dropdown">
    <button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
        Dropdown button
    </button>
    <ul class="dropdown-menu">
        <li><a class="dropdown-item" href="#">Action</a></li>
        <li><a class="dropdown-item" href="#">Another action</a></li>
        <li><a class="dropdown-item" href="#">Something else here</a></li>
    </ul>
</div>
`;
    addFromRawHtml(ast.childNodes, typographyHtml);
}
