import { defineAdderOptions } from '@svelte-add/core';

export const options = defineAdderOptions({
	cli: {
		question: 'Do you want to install the Supabase CLI for local development?',
		type: 'boolean',
		default: true,
	},
});
