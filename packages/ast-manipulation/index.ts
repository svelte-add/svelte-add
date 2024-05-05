import { getCssAstEditor, CssAstEditor } from "./css/index.js";
import { getHtmlAstEditor, HtmlAstEditor } from "./html/index.js";
import { getJsAstEditor, JsAstEditor } from "./js/index.js";

export { getCssAstEditor, getHtmlAstEditor, getJsAstEditor, CssAstEditor, HtmlAstEditor, JsAstEditor };

export type SvelteAstEditor = {
    js: JsAstEditor;
    html: HtmlAstEditor;
    css: CssAstEditor;
};
