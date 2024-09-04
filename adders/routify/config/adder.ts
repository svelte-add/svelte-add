import { defineAdderConfig } from '@svelte-add/core';
import { options } from './options';

export const adder = defineAdderConfig({
	metadata: {
		id: 'routify',
		name: 'Routify',
		description: 'The Router that Grows With You',
		environments: { svelte: true, kit: false },
		website: {
			logo: './routify.svg',
			keywords: ['routify', 'svelte', 'router'],
			documentation: 'https://routify.dev',
		},
	},
	options,
	integrationType: 'inline',
	packages: [{ name: '@roxi/routify', version: 'next', dev: true }],
	files: [
		{
			name: ({ typescript }) => `vite.config.${typescript.installed ? 'ts' : 'js'}`,
			contentType: 'script',
			content: ({ ast, array, object, functions, imports, exports }) => {
				const vitePluginName = 'routify';
				imports.addDefault(ast, '@roxi/routify/vite-plugin', vitePluginName);

				const { value: rootObject } = exports.defaultExport(
					ast,
					functions.call('defineConfig', []),
				);
				const param1 = functions.argumentByIndex(rootObject, 0, object.createEmpty());

				const pluginsArray = object.property(param1, 'plugins', array.createEmpty());
				const pluginFunctionCall = functions.call(vitePluginName, []);
				const pluginConfig = object.createEmpty();
				functions.argumentByIndex(pluginFunctionCall, 0, pluginConfig);

				array.push(pluginsArray, pluginFunctionCall);
			},
		},
		{
			name: () => 'src/App.svelte',
			contentType: 'svelte',
			content: ({ js, html }) => {
				js.imports.addNamed(js.ast, '@roxi/routify', {
					Router: 'Router',
					createRouter: 'createRouter',
				});
				js.imports.addDefault(js.ast, '../.routify/routes.default.js', 'routes');

				const routesObject = js.object.createEmpty();
				const routesIdentifier = js.variables.identifier('routes');
				js.object.property(routesObject, 'routes', routesIdentifier);
				const createRouterFunction = js.functions.call('createRouter', []);
				createRouterFunction.arguments.push(routesObject);
				const routerVariableDeclaration = js.variables.declaration(
					js.ast,
					'const',
					'router',
					createRouterFunction,
				);
				js.exports.namedExport(js.ast, 'router', routerVariableDeclaration);

				const router = html.element('Router', { '{router}': '' });
				html.insertElement(html.ast.childNodes, router);
			},
		},
		{
			name: () => 'src/routes/index.svelte',
			contentType: 'svelte',
			content: ({ html }) => {
				const htmlString = `${routifyDemoHtml}<p>On index</p>`;
				html.addFromRawHtml(html.ast.childNodes, htmlString);
			},
		},
		{
			name: () => 'src/routes/demo.svelte',
			contentType: 'svelte',
			content: ({ html }) => {
				const htmlString = `${routifyDemoHtml}<p>On demo</p>`;
				html.addFromRawHtml(html.ast.childNodes, htmlString);
			},
		},
	],
});

const routifyDemoHtml = `
<div class="routify-demo">
    <a class="index" style="margin: 5px;" href="/">Index</a>
    <a class="demo" style="margin: 5px;" href="/demo">Demo</a>
</div>
`;
