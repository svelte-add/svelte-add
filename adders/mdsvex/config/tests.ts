import { defineAdderTests } from '@svelte-add/core';
import { options } from './options';
import type {
	SvelteFileEditorArgs,
	TextFileEditorArgs,
} from '@svelte-add/core/files/processors.js';
import type { OptionDefinition } from '@svelte-add/core/adder/options.js';

export const tests = defineAdderTests({
	files: [
		{
			name: ({ kit }) => `${kit.routesDirectory}/+page.svelte`,
			contentType: 'svelte',
			content: useMarkdownFile,
			condition: ({ kit }) => kit.installed,
		},
		{
			name: () => `src/App.svelte`,
			contentType: 'svelte',
			content: useMarkdownFile,
			condition: ({ kit }) => !kit.installed,
		},
		{
			name: ({ kit }) => `${kit.routesDirectory}/Demo.svx`,
			contentType: 'text',
			content: addMarkdownFile,
			condition: ({ kit }) => kit.installed,
		},
		{
			name: () => `src/Demo.svx`,
			contentType: 'text',
			content: addMarkdownFile,
			condition: ({ kit }) => !kit.installed,
		},
	],
	options,
	optionValues: [],
	tests: [
		{
			name: 'elements exist',
			run: async ({ elementExists }) => {
				await elementExists('.mdsvex h1');
				await elementExists('.mdsvex h2');
				await elementExists('.mdsvex p');
			},
		},
	],
});

function addMarkdownFile<Args extends OptionDefinition>(editor: TextFileEditorArgs<Args>) {
	// example taken from website: https://mdsvex.pngwn.io
	return (
		editor.content +
		`
---
title: Svex up your markdown
---

# { title }

## Good stuff in your markdown

Markdown is pretty good but sometimes you just need more.
`
	);
}

function useMarkdownFile<Args extends OptionDefinition>({ js, html }: SvelteFileEditorArgs<Args>) {
	js.imports.addDefault(js.ast, './Demo.svx', 'Demo');

	const div = html.div({ class: 'mdsvex' });
	html.appendElement(html.ast.childNodes, div);
	const mdsvexNode = html.element('Demo');
	html.appendElement(div.childNodes, mdsvexNode);
}
