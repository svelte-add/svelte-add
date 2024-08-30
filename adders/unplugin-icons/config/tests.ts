import { defineAdderTests } from '@svelte-add/core';
import { options } from './options';

const defaultOptionValues = {
	collection: options.collection.default,
};

export const tests = defineAdderTests({
	options,
	optionValues: [
		{ ...defaultOptionValues },
		{ ...defaultOptionValues, collection: '@iconify-json/mdi' },
	],
	files: [
		{
			name: ({ kit }) => (kit.installed ? `${kit.routesDirectory}/+page.svelte` : `src/App.svelte`),
			contentType: 'svelte',
			condition: ({ options }) => options.collection !== 'none',
			content: ({ js, html }) => {
				js.imports.addDefault(js.ast, 'virtual:icons/mdi/add', 'IconAdd');
				js.imports.addDefault(js.ast, '~icons/mdi/minus', 'IconMinus');

				html.addFromRawHtml(
					html.ast.childNodes,
					`
						<div class="unplugin-icons">
							<IconAdd class="mdi-icon-1" />
							<IconMinus class="mdi-icon-2" />
						</div>
					`,
				);
			},
		},
	],
	tests: [
		{
			name: 'icons exist',
			condition: ({ collection }) => collection !== 'none',
			run: async ({ elementExists }) => {
				await elementExists('.unplugin-icons .mdi-icon-1');
				await elementExists('.unplugin-icons .mdi-icon-2');
			},
		},
	],
});
