import { defineAdderOptions } from '@svelte-add/core';

export const options = defineAdderOptions({
	useSass: {
		question: 'Do you want to use sass? (css = faster, sass = better customization)',
		type: 'boolean',
		default: false,
	},
});
