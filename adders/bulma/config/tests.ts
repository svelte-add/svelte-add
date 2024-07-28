import { defineAdderTests } from '@svelte-add/core';
import { options } from './options.js';
import type { OptionDefinition } from '@svelte-add/core/adder/options.js';
import type { SvelteFileEditorArgs } from '@svelte-add/core/files/processors.js';

const boxId = 'myBox';

export const tests = defineAdderTests({
	options,
	optionValues: [{ useSass: false }, { useSass: true }],
	files: [
		{
			name: ({ kit }) => `${kit.routesDirectory}/+page.svelte`,
			contentType: 'svelte',
			content: prepareTests,
			condition: ({ kit }) => kit.installed,
		},
		{
			name: () => `src/App.svelte`,
			contentType: 'svelte',
			content: prepareTests,
			condition: ({ kit }) => !kit.installed,
		},
	],
	tests: [
		{
			name: 'box properties',
			run: async ({ expectProperty }) => {
				const selector = '#' + boxId;
				await expectProperty(selector, 'background-color', 'rgb(255, 255, 255)');
				await expectProperty(selector, 'border-radius', '12px');
				await expectProperty(selector, 'color', 'rgb(64, 70, 84)');
				await expectProperty(selector, 'display', 'block');
				await expectProperty(selector, 'padding', '20px');
			},
		},
		{
			name: 'form properties',
			run: async ({ expectProperty }) => {
				await expectProperty('.field .label', 'color', 'rgb(46, 51, 61)');
				await expectProperty('.field .label', 'display', 'block');
				await expectProperty('.field .label', 'font-size', '16px');

				await expectProperty('.field .input', 'border-radius', '6px');
			},
		},
	],
});

function prepareBoxTest<Args extends OptionDefinition>({ html }: SvelteFileEditorArgs<Args>) {
	const div = html.div({ class: 'box', id: boxId });
	html.appendElement(html.ast.childNodes, div);
}

function prepareFormTest<Args extends OptionDefinition>({ html }: SvelteFileEditorArgs<Args>) {
	const rawHtmlTest = `<div class="field">
    <label class="label">Name</label>
    <div class="control">
        <input class="input" type="text" placeholder="Text input">
    </div>
</div>`;
	html.addFromRawHtml(html.ast.childNodes, rawHtmlTest);
}

function prepareTests<Args extends OptionDefinition>(editor: SvelteFileEditorArgs<Args>) {
	prepareBoxTest(editor);
	prepareFormTest(editor);
}
