// @ts-ignore
import * as typeScriptEstree from "@typescript-eslint/typescript-estree";
import { parseDocument } from "htmlparser2";
import * as postcss from "postcss";
import * as recast from "recast";

import serializeDom from "dom-serializer";

/**
 * @typedef {import("postcss").Root} PostCSSAst
 * @param {string} text
 * @returns {PostCSSAst}
 */
export const newPostcssAst = (text) => postcss.parse(text);

/**
 * @param {PostCSSAst} ast
 * @returns {string}
 */
export const stringifyPostcssAst = (ast) => ast.toString();

/**
 * @typedef {import("domhandler").Document} DomHandlerAst
 * @param {string} text
 * @returns {DomHandlerAst}
 */
export const newDomHandlerAst = (text) => parseDocument(text, { recognizeSelfClosing: true, lowerCaseTags: false });

/**
 * @param {DomHandlerAst} ast
 * @returns {string}
 */
export const stringifyDomHandlerAst = (ast) => serializeDom(ast, { encodeEntities: "utf8" });

// TODO: did I have to invent these types or did they already exist??

/**
 * @typedef {Object} Position
 * @property {number} line
 * @property {number} column
 * @property {number} token
 *
 * @typedef {Object} LOC
 * @property {Position} start
 * @property {Position} end
 * @property {unknown} lines
 * @property {number} indent
 * @property {unknown[]} tokens
 *
 * @typedef {Object} Program
 * @property {unknown[]} body
 * @property {string} sourceType
 * @property {LOC} loc
 *
 * @typedef {Object} RecastASTExtras
 * @property {string | null} name
 * @property {Program} program
 * @property {LOC} loc
 * @property {unknown} comments
 * @property {unknown} tokens
 *
 * @typedef {import("estree").BaseNode & import("ast-types").ASTNode & RecastASTExtras} RecastAST
 */

/**
 * @param {string} text
 * @returns {RecastAST}
 */
export const newTypeScriptEstreeAst = (text) =>
	recast.parse(text, {
		parser: {
			parse: typeScriptEstree.parse,
		},
	});

/**
 * @param {RecastAST} typeScriptEstree
 * @returns {string}
 */
export const stringifyTypeScriptEstreeAst = (typeScriptEstree) => recast.print(typeScriptEstree).code;
