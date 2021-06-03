import { parse as typeScriptEstreeParse } from "@typescript-eslint/typescript-estree";
import { parse as postcssParse } from "postcss";
import { parse as recastParse, print as recastPrint } from "recast";


/**
 * @param {string} text
 * @returns {import("postcss").Root}
 */
export const newPostcssAst = (text) => postcssParse(text);


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
export const newTypeScriptEstreeAst = (text) => recastParse(text, {
	parser: {
		parse: typeScriptEstreeParse,
	},
});


/**
 * @param {RecastAST} typeScriptEstree
 * @returns {string}
 */
export const stringifyTypeScriptEstreeAst = (typeScriptEstree) => recastPrint(typeScriptEstree).code
