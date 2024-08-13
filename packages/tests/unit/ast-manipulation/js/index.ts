import { expect, test } from 'vitest';
import { parseScript, serializeScript } from '@svelte-add/ast-tooling';
import { getJsAstEditor } from '@svelte-add/ast-manipulation';
import { readdir, readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const baseDir = resolve(fileURLToPath(import.meta.url), '..');
const dirs = (await readdir(baseDir, { withFileTypes: true }))
	.filter((dirent) => dirent.isDirectory())
	.map((dirent) => dirent.name);

for (const dir of dirs) {
	test(dir, async () => {
		const input = await readFile(join(baseDir, dir, 'input.js'));
		const ast = parseScript(input.toString());
		const editor = getJsAstEditor(ast);

		const module = await import(`./${dir}/run.ts`);
		module.run(editor);

		const output = serializeScript(ast);
		await expect(output).toMatchFileSnapshot(`./${dir}/output.js`);
	});
}
