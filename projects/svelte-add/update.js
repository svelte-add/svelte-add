import { parse as typescriptEstreeParse } from "@typescript-eslint/typescript-estree";
import { parse as acornParse } from "acorn";
import { writeFile } from "fs/promises";
import { parse as recastParse, print as recastPrint } from "recast";

import { readFile } from "./index.js";

/**
 * 
 * Example:
 * await updateFile({ 
 *     path: "/path/to/project/.gitignore",
 *     content: async ({ existed, text }) => {
 *         // modify the passed text
 *         return {
 *             text: "new text",
 *         };
 *     },
 * })
 * 
 * @param {object} param0
 * @param {string} param0.path
 * @param {function({ existed: boolean, text: string }): Promise<{ text: string }>} param0.content
 */
export const updateFile = async ({ path, content }) => {
    const { existed, text } = await readFile({ path });

    const out = await content({
        existed,
        text,
    });

    await writeFile(path, out.text, {
        encoding: "utf-8",
    });
};

/**
 * 
 * Example:
 * await updateJavaScript({ 
 *     path: "/path/to/project/tailwind.config.cjs",
 *     script: async ({ existed, acorn, typescriptEstree }) => {
 *         // modify the Acorn AST and return it
 *         return {
 *             acorn,
 *         };
 *         
 *         // or modify the TypeScript ESTree AST and return it
 *         return {
 *             typescriptEstree,
 *         };
 *     },
 * })
 * 
 * @param {object} param0
 * @param {string} param0.path
 * @param {function({ existed: boolean, acorn: import("acorn").Node, typescriptEstree: import("@typescript-eslint/typescript-estree").AST<{}> }): Promise<{ acorn: import("acorn").Node } | { typescriptEstree: import("@typescript-eslint/typescript-estree").AST<{}> }>} param0.script
 */
export const updateJavaScript = async ({ path, script }) => {
    updateFile({
        path,
        content: async ({ existed, text }) => {
            /**
             * @type {import("acorn").Node}
             */
            const acornAst = recastParse(text, {
                parser: {
                    parse: acornParse,
                },
            });

            /**
             * @type {import("@typescript-eslint/typescript-estree").AST<{}>}
             */
            const typescriptEstreeAst = recastParse(text, {
                parser: {
                    parse: typescriptEstreeParse,
                },
            });

            const out = await script({
                existed,
                acorn: acornAst,
                typescriptEstree: typescriptEstreeAst,
            });

            return {
                text: recastPrint("typescriptEstree" in out ? out.typescriptEstree : out.acorn).code,
            };
        },
    })
};

/**
 * 
 * Example:
 * await updateTypeScript({ 
 *     path: "/path/to/project/src/routes/graphql.ts",
 *     script: async ({ existed, typescriptEstree }) => {
 *         // modify the TypeScript ESTree AST
 *         return {
 *             typescriptEstree,
 *         };
 *     },
 * })
 * 
 * @param {object} param0
 * @param {string} param0.path
 * @param {function({ existed: boolean, typescriptEstree: import("@typescript-eslint/typescript-estree").AST<{}> }): Promise<{ typescriptEstree: import("@typescript-eslint/typescript-estree").AST<{}> }>} param0.script
 */
export const updateTypeScript = async ({ path, script }) => {
    updateFile({
        path,
        content: async ({ existed, text }) => {
            /**
             * @type {import("@typescript-eslint/typescript-estree").AST<{}>}
             */
            const ast = recastParse(text, {
                parser: {
                    parse: typescriptEstreeParse,
                },
            });

            const out = await script({
                existed,
                typescriptEstree: ast,
            });

            return {
                text: recastPrint(out.typescriptEstree).code,
            };
        }
    })
};

/**
 * 
 * Example:
 * await updateSvelte({ 
 *     path: "/path/to/project/src/lib/Counter.svelte",
 *     markup: async ({ posthtml }) => {
 *         // modify the PostHTML (superset of HTML) AST
 *     },
 *     script: async ({ acorn, lang, typescriptEstree }) => {
 *         if (lang === "js") {
 *             // modify the Acorn AST if JavaScript
 *             return {
 *                 acorn,
 *             };
 *         }
 * 
 *         if (lang === "ts") {
 *             // modify the TypeScript ESTree AST if TypeScript
 *             return {
 *                 acorn,
 *             };
 *         }
 *     },
 *     style: async ({ postcss }) => {
 *         // modify the PostCSS (superset of CSS) AST
 *     },
 * })
 * 
 * @param {*} param0 
 */
export const updateSvelte = async ({ }) => {
	
};

