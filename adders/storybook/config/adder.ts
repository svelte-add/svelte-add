import { defineAdderConfig } from '@svelte-add/core';
import { options } from './options.js';

export const adder = defineAdderConfig({
	metadata: {
		id: 'storybook',
		name: 'Storybook',
		description: 'Build UIs without the grunt work',
		environments: { kit: true, svelte: true },
		website: {
			logo: './storybook.svg',
			keywords: [
				'storybook',
				'styling',
				'testing',
				'documentation',
				'storybook-svelte-csf',
				'svelte-csf',
			],
			documentation: 'https://storybook.js.org/docs/get-started',
		},
	},

	options,
	integrationType: 'external',
	command: 'storybook@8.3.0-alpha.3 init --skip-install --no-dev',
});
