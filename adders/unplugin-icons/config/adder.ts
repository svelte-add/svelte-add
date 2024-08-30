import { defineAdderConfig } from '@svelte-add/core';
import { options } from './options';
import { collections } from '../collections';
import type { PackageDefinition } from '@svelte-add/core/adder/config';

export const adder = defineAdderConfig({
	metadata: {
		id: 'unplugin-icons',
		name: 'unplugin-icons ',
		description: 'Access thousands of icons as components on-demand universally.',
		environments: { svelte: true, kit: true },
		website: {
			logo: './unplugin-icons.svg',
			keywords: ['unplugin-icons', 'svg', 'icons', 'iconify', 'iconify-json'],
			documentation: 'https://www.npmjs.com/package/unplugin-icons',
		},
	},
	options,
	integrationType: 'inline',
	packages: [
		{ name: 'unplugin-icons', version: '^0.19.2', dev: true },
		...collections
			.filter((collection) => collection.name && collection.version)
			.map(
				({ name, version }) =>
					({
						name,
						version,
						dev: true,
						condition: ({ options }) => options.collection === name,
					}) as PackageDefinition<typeof options>,
			),
	],
	files: [
		{
			name: ({ typescript }) => `vite.config.${typescript.installed ? 'ts' : 'js'}`,
			contentType: 'script',
			content: ({ ast, imports, exports, functions, array, object, common }) => {
				const vitePluginName = 'Icons';
				imports.addDefault(ast, 'unplugin-icons/vite', vitePluginName);

				const { value: rootObject } = exports.defaultExport(
					ast,
					functions.call('defineConfig', []),
				);
				const param1 = functions.argumentByIndex(rootObject, 0, object.createEmpty());

				const pluginsArray = object.property(param1, 'plugins', array.createEmpty());
				const pluginFunctionCall = functions.call(vitePluginName, []);
				const pluginConfig = object.create({
					compiler: common.createLiteral('svelte'),
				});
				functions.argumentByIndex(pluginFunctionCall, 0, pluginConfig);

				array.push(pluginsArray, pluginFunctionCall);
			},
		},
		{
			name: () => 'src/app.d.ts',
			contentType: 'text',
			content: ({ content, dependencies }) => {
				return addImport(content, getIconTypes(dependencies));
			},
			condition: ({ typescript, kit }) => kit.installed && typescript.installed,
		},
		{
			name: () => 'src/vite-env.d.ts',
			contentType: 'text',
			content: ({ content, dependencies }) => {
				return addTypeReferenceComment(content, getIconTypes(dependencies));
			},
			condition: ({ typescript, kit }) => !kit.installed && typescript.installed,
		},
	],
});

const addTypeReferenceComment = (content: string, types: string) => {
	if (!hasTypeReferenceComment(content, types)) {
		const contentTrimmed = content.trimEnd();
		const trailingTrivia = content.slice(contentTrimmed.length);

		content = `${contentTrimmed}\n/// <reference types=${JSON.stringify(types)} />${trailingTrivia}`;
	}

	return content;
};

const hasTypeReferenceComment = (content: string, types: string) => {
	const regex = new RegExp(`///\\s*<\\s*reference\\s*types\\s*=\\s*(['"])${types}\\1\\s*/>`);
	return regex.test(content);
};

const addImport = (content: string, types: string) => {
	if (!hasImport(content, types)) {
		content = content.trimStart();
		if (content.startsWith('//') || content.startsWith('/*')) {
			content = `\n${content}`;
		}

		content = `import '${types}'\n${content};`;
	}

	return content;
};

const hasImport = (content: string, types: string) => {
	const regex = new RegExp(`import\\s+(['"])${types}\\1`);
	return regex.test(content);
};

const getIconTypes = (dependencies: Record<string, string>) => {
	if ((dependencies['svelte'] ?? '').startsWith('^3.')) {
		return 'unplugin-icons/types/svelte3';
	}

	return 'unplugin-icons/types/svelte';
};
