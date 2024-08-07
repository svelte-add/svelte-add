import { defineAdderTests } from '@svelte-add/core';
import { options } from './options.js';

let port = 6006;

export const tests = defineAdderTests({
	options,
	optionValues: [],
	get command() {
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		return `storybook -p ${port++} --ci`;
	},
	files: [
		// hack to prevent this build script from running
		{
			name: () => 'package.json',
			contentType: 'json',
			content: ({ data }) => {
				delete data.scripts.build;
			},
		},
	],
	tests: [
		{
			name: 'storybook loaded',
			run: async ({ elementExists }) => {
				await elementExists('main .sb-bar');
				await elementExists('#storybook-preview-wrapper');
			},
		},
	],
});
