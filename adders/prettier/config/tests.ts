import { defineAdderTests } from '@svelte-add/core';
import { options } from './options';

export const tests = defineAdderTests({
	files: [],
	options,
	optionValues: [],
	tests: [
		{
			name: '',
			run: async () => {},
		},
	],
});
