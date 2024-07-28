import fs from 'node:fs';
import path from 'node:path';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import dynamicImportVars from '@rollup/plugin-dynamic-import-vars';
import { preserveShebangs } from 'rollup-plugin-preserve-shebangs';
import esbuild from 'rollup-plugin-esbuild';
import dts from 'rollup-plugin-dts';

/** @type {import("rollup").RollupOptions[]} */
const dtsConfigs = [];

/**
 * @param {string} project
 */
function getConfig(project) {
	const inputs = [];
	let outDir = '';

	inputs.push(`./packages/${project}/index.ts`);

	if (project == 'core') inputs.push(`./packages/${project}/internal.ts`);

	outDir = `./packages/${project}/build`;

	const projectRoot = path.resolve(path.join(outDir, '..'));
	fs.rmSync(outDir, { force: true, recursive: true });

	/** @type {import("./packages/core/utils/common.js").Package} */
	const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
	// any dep under `dependencies` is considered external
	const externalDeps = Object.keys(pkg.dependencies ?? {});

	// externalizes `svelte-add` and `@svelte-add/` deps while also bundling `/clack` and `/adders`
	const external = [/^(svelte-add|@svelte-add\/(?!clack|adders)\w*)/g, ...externalDeps];

	/** @type {import("rollup").RollupOptions} */
	const config = {
		input: inputs,
		output: {
			dir: outDir,
			format: 'esm',
			sourcemap: true,
		},
		external,
		plugins: [
			preserveShebangs(),
			esbuild({ tsconfig: 'tsconfig.json', sourceRoot: projectRoot }),
			nodeResolve({ preferBuiltins: true, rootDir: projectRoot }),
			commonjs(),
			json(),
			dynamicImportVars(),
		],
	};

	// only generate dts files for libs
	if ('exports' in pkg) {
		// entry points need to have their own individual configs,
		// otherwise the `build` dir will generate unnecessary nested dirs
		// e.g. `packages/cli/build/packages/cli/index.d.ts` as opposed to: `packages/cli/build/index.d.ts`
		for (const input of inputs) {
			dtsConfigs.push({
				input,
				output: {
					dir: outDir,
				},
				external,
				plugins: [dts()],
			});
		}
	}

	return config;
}

export default [
	getConfig('clack-core'),
	getConfig('clack-prompts'),
	getConfig('ast-tooling'),
	getConfig('ast-manipulation'),
	getConfig('config'),
	getConfig('core'),
	getConfig('cli'),
	getConfig('testing-library'),
	getConfig('tests'),
	getConfig('dev-utils'),
	...dtsConfigs,
];
