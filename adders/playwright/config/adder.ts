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
				scripts['test:e2e'] ??= TEST_CMD;
				scripts['test'] ??= TEST_CMD;
				if (!scripts['test'].includes(TEST_CMD)) scripts['test'] += ` && ${TEST_CMD}`;
			},
		},
		{
			name: ({ typescript }) => `tests/sample.${typescript.installed ? 'ts' : 'js'}`,
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
			content: ({ ast, imports, exports, common, typescript, object }) => {
				let config;

				config = object.create({
					webServer: object.create({
						command: common.createLiteral('npm run build && npm run preview'),
						port: common.expressionFromString('4173'),
					}),
					testDir: common.createLiteral('tests'),
				});

				// type annotate config
				if (typescript.installed) {
					imports.addNamed(
						ast,
						'@playwright/test',
						{ PlaywrightTestConfig: 'PlaywrightTestConfig' },
						true,
					);
					config = common.typeAnnotateExpression(config, 'PlaywrightTestConfig');
				} else {
					common.addJsDocTypeComment(config, "import('@playwright/test').PlaywrightTestConfig");
				}

				const defaultExport = exports.defaultExport(ast, config);
				// if it's not the config we created, then we'll leave it alone and exit out
				if (defaultExport.value !== config) {
					log.warn('A playwright config is already defined. Skipping initialization.');
					return;
				}
			},
		},
	],
});
