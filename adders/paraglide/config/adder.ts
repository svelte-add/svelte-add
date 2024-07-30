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
			name: '@inlang/paraglide-js',
			version: '*',
			dev: true,
		},
		{
			name: '@inlang/paraglide-sveltekit',
			version: '*',
			dev: false,
		},
	],
	files: [
		{
			// create an inlang project
			name: () => 'project.inlang/settings.json',
			contentType: 'json',
			content: ({ options, data }) => {
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
			// reroute hook
			name: () => 'src/hooks.js',
			contentType: 'script',
			content({ ast, imports }) {
				imports.addNamed(ast, '$lib/i18n', {
					i18n: 'i18n',
				});
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

				const rootChildren = html.ast.children;
				if (rootChildren.length === 0) {
					const slot = html.element('slot');
					rootChildren.push(slot);
				}

				//wrap the HTML in a ParaglideJS instance
				const root = html.element('ParaglideJS', {});
				root.attribs = {
					i18n: '{i18n}',
				};
				root.attributes.push({
					name: 'i18n',
					value: 'i18n',
				});
				root.children = rootChildren;
				html.ast.children = [root];
			},
		},
	],
	nextSteps: () => [
		'Edit your messages in `messages/en.json`',
		'Consider installing the Sherlock IDE Extension',
	],
});
