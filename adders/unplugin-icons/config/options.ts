import { defineAdderOptions } from '@svelte-add/core';
import { collections } from '../collections';

export const options = defineAdderOptions({
	collection: {
		question: 'Do you want to install an icon collection?',
		type: 'select',
		default: 'none',
		options: collections.map((collection) => ({
			value: collection.name,
			label: collection.label,
			hint: collection.name,
		})),
	},
});
