import fs from 'node:fs';
import { join } from 'node:path';
import { dedent, defineAdderConfig, log } from '@svelte-add/core';
import { options } from './options.js';

export const adder = defineAdderConfig({
	metadata: {
		id: 'playwright',
		name: 'Playwright',
		description: 'A testing framework for end-to-end testing',
		environments: { svelte: true, kit: true },
		website: {
			logo: './playwright.svg',
			keywords: ['test', 'testing', 'end-to-end', 'e2e', 'integration'],
			documentation: 'https://playwright.dev/',
		},
	},
	options,
	integrationType: 'inline',
	packages: [{ name: '@playwright/test', version: '^1.45.3', dev: true }],
	files: [
		{
			name: () => 'package.json',
			contentType: 'json',
			content: ({ data }) => {
				data.scripts ??= {};
				const scripts: Record<string, string> = data.scripts;
				const TEST_CMD = 'playwright test';
				const RUN_TEST = 'npm run test:e2e';
				scripts['test:e2e'] ??= TEST_CMD;
				scripts['test'] ??= RUN_TEST;
				if (!scripts['test'].includes(RUN_TEST)) scripts['test'] += ` && ${RUN_TEST}`;
			},
		},
		{
			name: () => '.gitignore',
			contentType: 'text',
			condition: ({ cwd }) => fs.existsSync(join(cwd, '.gitignore')),
			content: ({ content }) => {
				if (content.includes('test-results')) return content;
				return 'test-results\n' + content.trim();
			},
		},
		{
			name: ({ typescript }) => `e2e/demo.test.${typescript.installed ? 'ts' : 'js'}`,
			contentType: 'text',
			content: ({ content }) => {
				if (content) return content;

				return dedent`
					import { expect, test } from '@playwright/test';

					test('home page has expected h1', async ({ page }) => {
						await page.goto('/');
						await expect(page.locator('h1')).toBeVisible();
					});
					`;
			},
		},
		{
			name: ({ typescript }) => `playwright.config.${typescript.installed ? 'ts' : 'js'}`,
			contentType: 'script',
			content: ({ ast, imports, exports, common, object }) => {
				const defineConfig = common.expressionFromString('defineConfig({})');
				const defaultExport = exports.defaultExport(ast, defineConfig);

				const config = {
					webServer: object.create({
						command: common.createLiteral('npm run build && npm run preview'),
						port: common.expressionFromString('4173'),
					}),
					testDir: common.createLiteral('e2e'),
				};

				if (
					defaultExport.value.type === 'CallExpression' &&
					defaultExport.value.arguments[0].type === 'ObjectExpression'
				) {
					// uses the `defineConfig` helper
					imports.addNamed(ast, '@playwright/test', { defineConfig: 'defineConfig' });
					object.properties(defaultExport.value.arguments[0], config);
				} else if (defaultExport.value.type === 'ObjectExpression') {
					// if the config is just an object expression, just add the property
					object.properties(defaultExport.value, config);
				} else {
					// unexpected config shape
					log.warn('Unexpected playwright config for playwright adder. Could not update.');
				}
			},
		},
	],
});
