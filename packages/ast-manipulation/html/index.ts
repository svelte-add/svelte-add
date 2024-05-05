import { HtmlChildNode, HtmlDocument, HtmlElement, HtmlElementType, parseHtml } from "@svelte-add/ast-tooling";

export type HtmlAstEditor = {
    ast: HtmlDocument;
    div: typeof div;
    element: typeof element;
    addFromRawHtml: typeof addFromRawHtml;
    insertElement: typeof insertElement;
    appendElement: typeof appendElement;
};

export function getHtmlAstEditor(document: HtmlDocument) {
    const editor: HtmlAstEditor = {
        ast: document,
        div,
        addFromRawHtml,
        element,
        insertElement,
        appendElement,
    };
    return editor;
}

function div(attributes: Record<string, string> = {}) {
    return element("div", attributes);
}

function element(tagName: string, attributes: Record<string, string> = {}) {
    const element = new HtmlElement(tagName, {}, undefined, HtmlElementType.Tag);
    element.attribs = attributes;
    return element;
}

function insertElement(childNodes: HtmlChildNode[], elementToInsert: HtmlChildNode) {
    childNodes.splice(0, 0, elementToInsert);
}

function appendElement(childNodes: HtmlChildNode[], elementToAppend: HtmlChildNode) {
    childNodes.push(elementToAppend);
}

function addFromRawHtml(childNodes: HtmlChildNode[], html: string) {
    const document = parseHtml(html);
    for (const childNode of document.childNodes) {
        childNodes.push(childNode);
    }
}
