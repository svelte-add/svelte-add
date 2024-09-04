import { dedent, defineAdderConfig, log, colors } from '@svelte-add/core';
import { options } from './options.js';
import { addEslintConfigPrettier } from '../../common.js';

export const adder = defineAdderConfig({
	metadata: {
		id: 'prettier',
		name: 'Prettier',
		description: 'An opinionated code formatter',
		environments: { svelte: true, kit: true },
		website: {
			logo: './prettier.svg',
			keywords: ['prettier', 'code', 'formatter', 'formatting'],
			documentation: 'https://prettier.io',
		},
	},
	options,
	integrationType: 'inline',
	packages: [
		{ name: 'prettier', version: '^3.3.2', dev: true },
		{ name: 'prettier-plugin-svelte', version: '^3.2.5', dev: true },
		{
			name: 'eslint-config-prettier',
			version: '^9.1.0',
			dev: true,
			condition: ({ dependencies }) => hasEslint(dependencies),
		},
	],
	files: [
		{
			name: () => `.prettierignore`,
			contentType: 'text',
			content: ({ content }) => {
				if (content) return content;
				return dedent`
                    # Package Managers
                    package-lock.json
                    pnpm-lock.yaml
                    yarn.lock
                `;
			},
		},
		{
			name: () => '.prettierrc',
			contentType: 'json',
			content: ({ data }) => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				if (Object.keys(data).length === 0) {
					// we'll only set these defaults if there is no pre-existing config
					data.useTabs = true;
					data.singleQuote = true;
					data.trailingComma = 'none';
					data.printWidth = 100;
				}

				data.plugins ??= [];
				data.overrides ??= [];

				const plugins: string[] = data.plugins;
				if (!plugins.includes('prettier-plugin-svelte')) {
					data.plugins.unshift('prettier-plugin-svelte');
				}

				const overrides: { files: string | string[]; options?: { parser?: string } }[] =
					data.overrides;
				const override = overrides.find((o) => o?.options?.parser === 'svelte');
				if (!override) {
					overrides.push({ files: '*.svelte', options: { parser: 'svelte' } });
				}
			},
		},
		{
			name: () => 'package.json',
			contentType: 'json',
			content: ({ data, dependencies }) => {
				data.scripts ??= {};
				const scripts: Record<string, string> = data.scripts;
				const CHECK_CMD = 'prettier --check .';
				scripts['format'] ??= 'prettier --write .';

				if (hasEslint(dependencies)) {
					scripts['lint'] ??= `${CHECK_CMD} && eslint .`;
					if (!scripts['lint'].includes(CHECK_CMD)) scripts['lint'] += ` && ${CHECK_CMD}`;
				} else {
					scripts['lint'] ??= CHECK_CMD;
				}
			},
		},
		{
			name: () => 'eslint.config.js',
			contentType: 'script',
			condition: ({ dependencies: deps }) => {
				// We only want this to execute when it's `false`, not falsy
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
				if (deps['eslint']?.startsWith(SUPPORTED_ESLINT_VERSION) === false) {
					log.warn(
						`An older major version of ${colors.yellow('eslint')} was detected. Skipping ${colors.yellow('eslint-config-prettier')} installation.`,
					);
				}
				return hasEslint(deps);
			},
			content: addEslintConfigPrettier,
		},
	],
});

const SUPPORTED_ESLINT_VERSION = '9';

function hasEslint(deps: Record<string, string>): boolean {
	return !!deps['eslint'] && deps['eslint'].startsWith(SUPPORTED_ESLINT_VERSION);
}
