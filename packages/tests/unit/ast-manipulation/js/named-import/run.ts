import type { JsAstEditor } from '@svelte-add/ast-manipulation';

export function run(editor: JsAstEditor) {
	editor.imports.addNamed(editor.ast, 'package', { namedOne: 'namedOne' }, false);
}
