import { defineAdderOptions } from '@svelte-add/core';

export const options = defineAdderOptions({
	availableLanguageTags: {
		question: 'Which language tags would you like to support?',
		type: 'string',
		default: 'en',
	},
	routing: {
		question: 'Which routing strategy would you like to use?',
		type: 'select',
		default: 'prefix',
		options: [
			{ value: 'prefix', label: 'Path Prefix' },
			{ value: 'domain', label: 'Domain' },
		],
	},
});
