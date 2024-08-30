/**
 * This script updates all collections supported by the unplugin-icons adder.
 * It does this by searching all "@iconify-json/*" packages using pnpm.
 */

// @ts-check
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { format, resolveConfig } from 'prettier';

(async () => {
	const json = execSync('pnpm search --json "@iconify-json/"').toString('utf-8');
	/** @type {Array<{ name: string, scope: string, version: string, description: string }>} */
	const packages = JSON.parse(json);

	const allowedScopes = ['iconify', 'iconify-json'];
	const stripDescription = ' icon set in Iconify JSON format';
	/** @type {Record<string, string | undefined>} */
	const replacedDescriptions = {
		'@iconify/json': 'Full Collection (~120MB)',
	};

	const collections = [
		{
			name: 'none',
			version: undefined,
			label: 'None',
		},
	];

	for (const pkg of packages) {
		if (!allowedScopes.includes(pkg.scope)) {
			continue;
		}

		const description =
			replacedDescriptions[pkg.name] ?? pkg.description.replace(stripDescription, '');

		collections.push({
			name: pkg.name,
			version: `^${pkg.version}`,
			label: description,
		});
	}

	const codePath = 'adders/unplugin-icons/collections.ts';
	const config = await resolveConfig(codePath, { editorconfig: true });

	const code = await format(
		`
			/**
			 * This file is auto generated and can be updated by running:
			 * $ node scripts/update-unplugin-icons-collections
			 */
			
			export const collections = ${JSON.stringify(collections)};
		`,
		{
			...(config ?? {}),
			filepath: codePath,
		},
	);
	writeFileSync(codePath, code);

	console.log(`Wrote ${codePath}`);
})().catch(
	/** @param {unknown} e} */
	(e) => {
		console.error(e);
		process.exit(1);
	},
);
