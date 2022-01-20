import { parse as typeScriptEstreeParse } from "@typescript-eslint/typescript-estree";
import { parse as postcssParse } from "postcss";
import { parser as posthtmlParser } from "posthtml-parser";
import { render as posthtmlRender } from "posthtml-render";
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
 * @param {string} text
 * @returns {ReturnType<typeof posthtmlParser>}
 */
export const newPosthtmlAst = (text) => posthtmlParser(text);

/**
 * @param {ReturnType<typeof posthtmlParser>} ast
 * @returns {string}
 */
export const stringifyPosthtmlAst = (ast) => posthtmlRender(ast);

// TODO: did I have to invent these types or did they already exist??

/**
 * @typedef {object} Position
 * @property {number} line
 * @property {number} column
 * @property {number} token
 *
 * @typedef {object} LOC
 * @property {Position} start
 * @property {Position} end
 * @property {unknown} lines
 * @property {number} indent
 * @property {unknown[]} tokens
 *
 * @typedef {object} Program
 * @property {unknown[]} body
 * @property {string} sourceType
 * @property {LOC} loc
 *
 * @typedef {object} RecastASTExtras
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
