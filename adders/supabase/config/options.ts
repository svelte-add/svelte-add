import { colors, defineAdderOptions } from '@svelte-add/core';

export const options = defineAdderOptions({
	admin: {
		question: `Do you want to add an Supabase admin client? ${colors.red('Warning: This client bypasses row level security, only use server side.')}`,
		type: 'boolean',
		default: false,
	},
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
