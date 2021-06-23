import { parse as typeScriptEstreeParse } from "@typescript-eslint/typescript-estree";
import { parse as postcssParse } from "postcss";
import posthtmlParserImport from "posthtml-parser";
import posthtmlRenderImport from "posthtml-render";
import { parse as recastParse, print as recastPrint } from "recast";

/**
 * @typedef {import("postcss").Root} PostCSSAst
 * @param {string} text
 * @returns {PostCSSAst}
 */
export const newPostcssAst = (text) => postcssParse(text);

/**
 * @param {PostCSSAst} ast
 * @returns {string}
 */
export const stringifyPostcssAst = (ast) => ast.toString();

/**
 * @callback PosthtmlParser
 * @param {string} html
 * @param {import("posthtml-parser").Options} [options]
 * @returns {import("posthtml-parser").Node[]}
 */
const posthtmlParserNamespace = /** @type {any} */ (posthtmlParserImport);
/** @type {PosthtmlParser} */
const posthtmlParser = posthtmlParserNamespace.default;

/**
 * @param {string} text
 * @returns {ReturnType<typeof posthtmlParser>}
 */
export const newPosthtmlAst = (text) => posthtmlParser(text);

/**
 * @callback PosthtmlRender
 * @param {import("posthtml-parser").Node[]} tree
 * @param {unknown} [options]
 * @returns {string}
 */
const posthtmlRenderNamespace = /** @type {any} */ (posthtmlRenderImport);
/** @type {PosthtmlRender} */
const posthtmlRender = posthtmlRenderNamespace.default;

/**
 * @param {ReturnType<typeof posthtmlParser>} ast
 * @returns {string}
 */
export const stringifyPosthtmlAst = (ast) => posthtmlRender(ast);

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
	recastParse(text, {
		parser: {
			parse: typeScriptEstreeParse,
		},
	});

/**
 * @param {RecastAST} typeScriptEstree
 * @returns {string}
 */
export const stringifyTypeScriptEstreeAst = (typeScriptEstree) => recastPrint(typeScriptEstree).code;
