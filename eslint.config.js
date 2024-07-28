import js from '@eslint/js';
import eslintPrettier from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	js.configs.recommended,
	...tseslint.configs.strictTypeChecked,
	// ...tseslint.configs.stylisticTypeChecked,
	eslintPrettier,
	{
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.node,
			},
			parserOptions: {
				project: ['./tsconfig.json', './packages/website/tsconfig.json'],
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			'@typescript-eslint/no-unnecessary-condition': 'off',
			'@typescript-eslint/no-dynamic-delete': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					caughtErrors: 'none',
				},
			],
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-empty-object-type': 'off',
		},
	},
	{
		ignores: [
			'**/node_modules/*',
			'**/build/*',
			'adders/*/build',
			'packages/ast-manipulation/build',
			'packages/ast-tooling/build',
			'packages/cli/build',
			'packages/core/build',
			'packages/dev-utils/build',
			'packages/testing-library/build',
			'packages/tests/.outputs',
			'packages/tests/build',
			'packages/website/.svelte-kit',
			'packages/website/build',
			'packages/website',
			'packages/clack-core',
			'packages/clack-prompts',
			'temp',
		],
	},
);
