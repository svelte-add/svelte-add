import { parse as tsParse } from "recast/parsers/typescript.js";
import { parse as recastParse, print as recastPrint } from "recast";
import { Document, Element, Text, ChildNode } from "domhandler";
import { ElementType, parseDocument } from "htmlparser2";
import { appendChild, removeElement, textContent } from "domutils";
import serializeDom from "dom-serializer";
import { Root as CssAst, Declaration, Rule, AtRule, Comment } from "postcss";
import { parse as postcssParse } from "postcss";
import { namedTypes as AstTypes } from "ast-types";
import * as AstKinds from "ast-types/gen/kinds";
import * as fleece from "silver-fleece";
import * as Walker from "zimmerframe";

/**
 * Most of the AST tooling is pretty big in bundle size and bundling takes forever.
 * Nevertheless bundling of these tools seems smart, as they add many dependencies to each install.
 * In order to avoid long bundling during development, all of the AST tools have been extracted
 * into this separate package and are bundled only here. This package has been marked as external
 * and will not be bundled into all other projects / bundles.
 */

export {
    // html
    Document as HtmlDocument,
    Element as HtmlElement,
    ElementType as HtmlElementType,
    ChildNode as HtmlChildNode,

    // css
    CssAst,
    Declaration,
    Rule,
    AtRule,
    Comment,

    // js
    AstTypes,
    AstKinds,

    // ast walker
    Walker,
};

export function parseScript(content: string): AstTypes.Program {
    const jsAst: AstTypes.Program = recastParse(content, {
        parser: {
            parse: tsParse,
        },
    }).program;

    return stripAst(jsAst, "loc");
}

export function serializeScript(ast: AstTypes.ASTNode) {
    return recastPrint(ast).code;
}

export function parsePostcss(content: string) {
    return postcssParse(content);
}

export function serializePostcss(ast: CssAst) {
    return ast.toString();
}

export function parseHtml(content: string) {
    return parseDocument(content, {
        recognizeSelfClosing: true,
        lowerCaseTags: false,
    });
}

export function serializeHtml(ast: Document) {
    return serializeDom(ast, { encodeEntities: "utf8", selfClosingTags: true });
}

export function stripAst<T extends unknown>(node: T, propToRemove: string): T {
    if (typeof node !== "object" || node === null) return node;
    if (propToRemove in node) delete node[propToRemove as keyof T];

    // node traversal
    for (const key in node) {
        const child = node[key];
        if (child && typeof child === "object") {
            if (Array.isArray(child)) {
                child.forEach((c) => stripAst(c, propToRemove));
            } else {
                stripAst(child, propToRemove);
            }
        }
    }

    // we do this to transform nodes into POJOs
    return structuredClone(node);
}

export type SvelteAst = {
    jsAst: AstTypes.Program;
    htmlAst: Document;
    cssAst: CssAst;
};

export function parseSvelteFile(content: string): SvelteAst {
    const htmlAst = parseHtml(content);

    let scriptTag, styleTag: Element | undefined;
    for (const node of htmlAst.childNodes) {
        if (node.type === ElementType.Script) {
            scriptTag = node;
            removeElement(scriptTag);
        } else if (node.type === ElementType.Style) {
            styleTag = node;
            removeElement(styleTag);
        }
    }

    if (!scriptTag) {
        scriptTag = new Element("script", {}, undefined, ElementType.ElementType.Script);
    }
    if (!styleTag) {
        styleTag = new Element("style", {}, undefined, ElementType.ElementType.Style);
    }

    const css = textContent(styleTag);
    const cssAst = parsePostcss(css);

    const scriptValue = textContent(scriptTag);
    const jsAst = parseScript(scriptValue);

    return { jsAst, htmlAst, cssAst };
}

export function serializeSvelteFile(asts: SvelteAst) {
    const { jsAst, htmlAst, cssAst } = asts;

    const css = serializePostcss(cssAst);
    const newScriptValue = serializeScript(jsAst);

    const scriptTag = new Element("script", {}, undefined, ElementType.ElementType.Script);
    for (const child of scriptTag.children) {
        removeElement(child);
    }
    appendChild(scriptTag, new Text(newScriptValue));
    appendChild(htmlAst, scriptTag);

    const styleTag = new Element("style", {}, undefined, ElementType.ElementType.Style);
    for (const child of styleTag.children) {
        removeElement(child);
    }
    appendChild(styleTag, new Text(css));
    appendChild(htmlAst, styleTag);

    const content = serializeHtml(htmlAst);
    return content;
}

export function parseJson(content: string) {
    // some of the files we need to process contain comments. The default
    // node JSON.parse fails parsing those comments.

    // use https://github.com/Rich-Harris/golden-fleece#fleecepatchstr-value instead
    return fleece.evaluate(content);
}

export function serializeJson(originalInput: string, data: any) {
    // some of the files we need to process contain comments. The default
    // node JSON.parse fails parsing those comments.
    return fleece.patch(originalInput, data);
}
