import { defineAdderTests } from '@svelte-add/core';
import { options } from './options';
import type { OptionDefinition } from '@svelte-add/core/adder/options.js';
import type { SvelteFileEditorArgs } from '@svelte-add/core/files/processors.js';

const divId = 'myDiv';
const typographyDivId = 'myTypographyDiv';
const formsInputId = 'myFormInput';

const defaultOptions = { forms: false, typography: false };

export const tests = defineAdderTests({
	files: [
		{
			name: ({ kit }) => `${kit.routesDirectory}/+page.svelte`,
			contentType: 'svelte',
			content: (editor) => {
				prepareCoreTest(editor);
				if (editor.options.typography) prepareTypographyTest(editor);
				if (editor.options.forms) prepareFormsTest(editor);
			},
			condition: ({ kit }) => kit.installed,
		},
		{
			name: () => `src/App.svelte`,
			contentType: 'svelte',
			content: (editor) => {
				prepareCoreTest(editor);
				if (editor.options.typography) prepareTypographyTest(editor);
				if (editor.options.forms) prepareFormsTest(editor);
			},
			condition: ({ kit }) => !kit.installed,
		},
	],
	options,
	optionValues: [
		defaultOptions,
		{ ...defaultOptions, forms: true },
		{ ...defaultOptions, typography: true },
	],
	tests: [
		{
			name: 'core properties',
			run: async ({ expectProperty }) => {
				const selector = '#' + divId;
				await expectProperty(selector, 'background-color', 'rgb(71, 85, 105)');
				await expectProperty(selector, 'border-color', 'rgb(249, 250, 251)');
				await expectProperty(selector, 'border-width', '4px');
				await expectProperty(selector, 'margin-top', '4px');
			},
		},
		{
			name: 'typography properties',
			condition: ({ typography }) => typography,
			run: async ({ expectProperty }) => {
				const selector = '#' + typographyDivId;
				await expectProperty(selector, 'font-size', '18px');
				await expectProperty(selector, 'line-height', '28px');
				await expectProperty(selector, 'text-align', 'right');
				await expectProperty(selector, 'text-decoration-line', 'line-through');
			},
		},
		{
			name: 'forms properties',
			condition: ({ forms }) => forms,
			run: async ({ expectProperty }) => {
				const selector = '#' + formsInputId;
				await expectProperty(selector, 'padding-top', '8px');
				await expectProperty(selector, 'padding-left', '12px');
				await expectProperty(selector, 'font-size', '18px');
				await expectProperty(selector, 'line-height', '28px');
			},
		},
	],
});

function prepareCoreTest<Args extends OptionDefinition>({ html }: SvelteFileEditorArgs<Args>) {
	const div = html.div({ class: 'bg-slate-600 border-gray-50 border-4 mt-1', id: divId });
	html.appendElement(html.ast.childNodes, div);
}

function prepareTypographyTest<Args extends OptionDefinition>({
	html,
}: SvelteFileEditorArgs<Args>) {
	const div = html.element('p', { class: 'text-lg text-right line-through', id: typographyDivId });
	html.appendElement(html.ast.childNodes, div);
}

function prepareFormsTest<Args extends OptionDefinition>({ html }: SvelteFileEditorArgs<Args>) {
	const input = html.element('input', { type: 'email', class: 'text-lg', id: formsInputId });
	html.appendElement(html.ast.childNodes, input);
}
