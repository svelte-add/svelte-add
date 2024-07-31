import fs from 'node:fs';
import path from 'node:path';
import { defineAdderConfig } from '@svelte-add/core';
import { options } from './options';

const DEFAULT_INLANG_PROJECT = {
	$schema: 'https://inlang.com/schema/project-settings',
	sourceLanguageTag: 'en',
	languageTags: ['en'],
	modules: [
		'https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-empty-pattern@latest/dist/index.js',
		'https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-identical-pattern@latest/dist/index.js',
		'https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-missing-translation@latest/dist/index.js',
		'https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-without-source@latest/dist/index.js',
		'https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-valid-js-identifier@latest/dist/index.js',
		'https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@latest/dist/index.js',
		'https://cdn.jsdelivr.net/npm/@inlang/plugin-m-function-matcher@latest/dist/index.js',
	],
	'plugin.inlang.messageFormat': {
		pathPattern: './messages/{languageTag}.json',
	},
};

/**
 * If some parts of the automated setup fail we need to tell the user to do it manually.
 */
const manualSteps: string[] = [];

export const adder = defineAdderConfig({
	metadata: {
		id: 'paraglide',
		name: 'Paraglide',
		description: 'Typesafe i18n with localized routing',
		environments: { svelte: false, kit: true },
		website: {
			logo: './paraglide.png',
			keywords: [
				'i18n',
				'internationalization',
				'l10n',
				'localization',
				'routing',
				'paraglide',
				'paraglide-js',
				'paraglide-sveltekit',
				'inlang',
			],
			documentation: 'https://inlang.com/m/dxnzrydw/paraglide-sveltekit-i18n',
		},
	},
	options,
	integrationType: 'inline',
	packages: [
		{
			name: '@inlang/paraglide-sveltekit',
			version: '^0.11.0',
			dev: false,
		},
	],
	files: [
		{
			// create an inlang project if it doesn't exist yet
			// TODO Scan for & use existing projects
			name: () => 'project.inlang/settings.json',
			condition: ({ cwd }) => !fs.existsSync(path.join(cwd, 'project.inlang')),
			contentType: 'json',
			content: ({ options, data }) => {
				for (const key in DEFAULT_INLANG_PROJECT) {
					data[key] = DEFAULT_INLANG_PROJECT[key];
				}

				const availableLanguageTags = options.availableLanguageTags
					.split(',')
					.map((tag) => tag.trim());
				const sourceLanguageTag = availableLanguageTags[0];

				data.sourceLanguageTag = sourceLanguageTag;
				data.availableLanguageTags = availableLanguageTags;
			},
		},
		{
			// add the vite plugin
			name: ({ typescript }) => `vite.config.${typescript.installed ? 'ts' : 'js'}`,
			contentType: 'script',
			content: ({ ast, array, object, functions, common, imports, exports }) => {
				const vitePluginName = 'paraglide';
				imports.addDefault(ast, '@inlang/paraglide-sveltekit/vite', vitePluginName);

				const { value: rootObject } = exports.defaultExport(
					ast,
					functions.call('defineConfig', []),
				);
				const param1 = functions.argumentByIndex(rootObject, 0, object.createEmpty());

				const pluginsArray = object.property(param1, 'plugins', array.createEmpty());
				const pluginFunctionCall = functions.call(vitePluginName, []);
				const pluginConfig = object.create({
					project: common.createLiteral('./project.inlang'),
					outdir: common.createLiteral('./src/lib/paraglide'),
				});
				functions.argumentByIndex(pluginFunctionCall, 0, pluginConfig);

				array.push(pluginsArray, pluginFunctionCall);
			},
		},
		{
			// src/lib/i18n file
			name: ({ typescript }) => `src/lib/i18n.${typescript.installed ? 'ts' : 'js'}`,
			contentType: 'script',
			content({ ast, imports, exports, variables, common }) {
				imports.addNamed(ast, '@inlang/paraglide-sveltekit', { createI18n: 'createI18n' });
				imports.addDefault(ast, '$lib/paraglide/runtime', '* as runtime');

				const createI18nExpression = common.expressionFromString('createI18n(runtime)');
				const i18n = variables.declaration(ast, 'const', 'i18n', createI18nExpression);

				const existingExport = exports.namedExport(ast, 'i18n', i18n);
				if (existingExport) {
					manualSteps.push(
						'⚠️ Setting up $lib/i18n failed because it aleady exports an i18n function. Check that it is correct',
					);
				}
			},
		},
		{
			// reroute hook
			name: ({ typescript }) => `src/hooks.${typescript.installed ? 'ts' : 'js'}`,
			contentType: 'script',
			content({ ast, imports, exports, variables, common }) {
				imports.addNamed(ast, '$lib/i18n', {
					i18n: 'i18n',
				});

				const expression = common.expressionFromString('i18n.reroute()');
				const rerouteIdentifier = variables.declaration(ast, 'const', 'reroute', expression);

				const existingExport = exports.namedExport(ast, 'reroute', rerouteIdentifier);
				if (existingExport) {
					manualSteps.push('⚠️ Adding the reroute hook automatically failed. Add it manually');
				}
			},
		},
		{
			// handle hook
			name: ({ typescript }) => `src/hooks.server.${typescript.installed ? 'ts' : 'js'}`,
			contentType: 'script',
			content({ ast, imports, exports, variables, common }) {
				imports.addNamed(ast, '$lib/i18n', {
					i18n: 'i18n',
				});

				const expression = common.expressionFromString('i18n.handle()');
				const rerouteIdentifier = variables.declaration(ast, 'const', 'handle', expression);
				const existingExport = exports.namedExport(ast, 'handle', rerouteIdentifier);
				if (existingExport) {
					manualSteps.push('⚠️ Adding the handle hook automatically failed. Add it manually');

					// TODO automatically apply the sequence to merge the hooks
					/*
					imports.addNamed(ast, '@sveltejs/kit/hooks', {
						sequence: 'sequence',
					});
					*/
				}
			},
		},
		{
			// add the <ParaglideJS> component to the layout
			name: ({ kit }) => `${kit.routesDirectory}/+layout.svelte`,
			contentType: 'svelte',
			content: ({ js, html }) => {
				js.imports.addNamed(js.ast, '@inlang/paraglide-sveltekit', {
					ParaglideJS: 'ParaglideJS',
				});
				js.imports.addNamed(js.ast, '$lib/i18n', {
					i18n: 'i18n',
				});

				// wrap the HTML in a ParaglideJS instance
				// TODO: Skip if this is already done
				const rootChildren = html.ast.children;
				if (rootChildren.length === 0) {
					const slot = html.element('slot');
					rootChildren.push(slot);
				}
				const root = html.element('ParaglideJS', {});
				root.attribs = {
					'{i18n}': '',
				};
				root.children = rootChildren;
				html.ast.children = [root];
			},
		},
		// add the langauge file
		{
			name: ({ options }) => `messages/${options.sourceLanguageTag}.json`,
			contentType: 'json',
			content: ({ data }) => {
				data['$schema'] = 'https://inlang.com/schema/inlang-message-format';
				data.hello_world = 'Hello, World!';
			},
		},
	],
	nextSteps: ({ options }) => [
		...manualSteps,
		'Edit your messages in `messages/en.json`',
		'Consider installing the Sherlock IDE Extension',
	],
});
