import { colors, defineAdderOptions } from '@svelte-add/core';

export const options = defineAdderOptions({
	cli: {
		question: 'Do you want to install the Supabase CLI for local development?',
		type: 'boolean',
		default: true,
	},
	helpers: {
		question: `Do you want to add Supabase helper scripts to your package.json? E.g., ${colors.yellow('db:reset')} and ${colors.yellow('db:migration "description"')}`,
		type: 'boolean',
		default: false,
		condition: ({ cli }) => cli === true,
	},
});
