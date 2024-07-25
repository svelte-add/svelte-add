import { getCssAstEditor, type CssAstEditor } from './css/index.js';
import { getHtmlAstEditor, type HtmlAstEditor } from './html/index.js';
import { getJsAstEditor, type JsAstEditor } from './js/index.js';

export {
	getCssAstEditor,
	getHtmlAstEditor,
	getJsAstEditor,
	type CssAstEditor,
	type HtmlAstEditor,
	type JsAstEditor,
};

export type SvelteAstEditor = {
	js: JsAstEditor;
	html: HtmlAstEditor;
	css: CssAstEditor;
};
