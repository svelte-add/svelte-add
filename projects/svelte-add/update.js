import { unlink, writeFile } from "fs/promises";
import { preprocess } from "svelte/compiler";

import { readFile } from "./index.js";
import { newPostcssAst, newPosthtmlAst, newTypeScriptEstreeAst, stringifyPostcssAst, stringifyPosthtmlAst, stringifyTypeScriptEstreeAst } from "./ast.js";

/**
 * 
 * Example:
 * await updateFile({ 
 *     path: "/path/to/project/.gitignore",
 *     content: async ({ exists, text }) => {
 *         // modify the passed text
 *         return {
 *             text: "new text",
 *         };
 *     },
 * })
 * 
 * @param {object} param0
 * @param {string} param0.path
 * @param {function({ exists: boolean, text: string }): Promise<{ exists: false } | { text: string }>} param0.content
 * @returns {Promise<void>}
 */
export const updateFile = async ({ path, content }) => {
	const { exists, text } = await readFile({ path });

	const out = await content({
		exists,
		text,
	});

	if ("exists" in out) {
		try {
			await unlink(path);
		} catch (e) {
			if (e.code !== "ENOENT") throw e;
		}
		return;
	}

	await writeFile(path, out.text, {
		encoding: "utf-8",
	});
};

/**
 * 
 * Example:
 * await updateCss({ 
 *     path: "/path/to/project/src/app.postcss",
 *     script: async ({ exists, postcss }) => {
 *         // modify the PostCSS AST and return it
 *         return {
 *             postcss,
 *         };
 *     },
 * })
 * 
 * @param {object} param0
 * @param {string} param0.path
 * @param {function({ exists: boolean, postcss: ReturnType<typeof newPostcssAst> }): Promise<{ exists: false } | { postcss: ReturnType<typeof newPostcssAst> }>} param0.style
 * @returns {Promise<void>}
 */
export const updateCss = async ({ path, style }) => {
	await updateFile({
		path,
		content: async ({ exists, text }) => {
			const postcssAst = newPostcssAst(text);

			const out = await style({
				exists,
				postcss: postcssAst,
			});

			if ("exists" in out) return { exists: false };

			return {
				text: stringifyPostcssAst(out.postcss),
			};
		},
	})
};

/**
 * 
 * Example:
 * await updateJavaScript({ 
 *     path: "/path/to/project/tailwind.config.cjs",
 *     script: async ({ exists, typeScriptEstree }) => {
 *         // modify the TypeScript ESTree AST and return it
 *         return {
 *             typeScriptEstree,
 *         };
 *     },
 * })
 * 
 * @param {object} param0
 * @param {string} param0.path
 * @param {function({ exists: boolean, typeScriptEstree: ReturnType<typeof newTypeScriptEstreeAst> }): Promise<{ exists: false } | { typeScriptEstree: ReturnType<typeof newTypeScriptEstreeAst> }>} param0.script
 * @returns {Promise<void>}
 */
export const updateJavaScript = async ({ path, script }) => {
	await updateFile({
		path,
		content: async ({ exists, text }) => {
			const typeScriptEstreeAst = newTypeScriptEstreeAst(text);

			const out = await script({
				exists,
				typeScriptEstree: typeScriptEstreeAst,
			});

			if ("exists" in out) return { exists: false };

			return {
				text: stringifyTypeScriptEstreeAst(out.typeScriptEstree),
			};
		},
	});
};

/**
 * 
 * Example:
 * await updateJson({ 
 *     path: "/path/to/project/firebase.json",
 *     json: async ({ exists, obj }) => {
 *         // modify the JSON and return it
 *         return {
 *             obj,
 *         };
 *     },
 * })
 * 
 * @param {object} param0
 * @param {string} param0.path
 * @param {function({ exists: boolean, obj: any }): Promise<{ obj: any }>} param0.json
 * @returns {Promise<void>}
 */
export const updateJson = async ({ path, json }) => {
	await updateFile({
		path,
		content: async ({ exists, text }) => {
			const obj = JSON.parse(text);

			const out = await json({
				exists,
				obj,
			});

			return {
				text: JSON.stringify(out.obj, null, "\t"),
			};
		},
	})
};

/** @typedef {"coffee" | "ts" | undefined} ScriptLang */
/** @typedef {"postcss" | "scss" | undefined} StyleLang */

/**
 * 
 * Example:
 * await updateSvelte({ 
 *     path: "/path/to/project/src/lib/Counter.svelte",
 *     markup: async ({ posthtml }) => {
 *         // modify the PostHTML (superset of HTML) AST
 *     },
 *     moduleScript: async ({ lang, typeScriptEstree }) => {
 * 
 *         // modify the TypeScript ESTree AST and return it
 *         return {
 *             lang,
 *             typeScriptEstree,
 *         };
 *     },
 *     script: async ({ lang, typeScriptEstree }) => {
 * 
 *         // modify the TypeScript ESTree AST and return it
 *         return {
 *             lang,
 *             typeScriptEstree,
 *         };
 *     },
 *     style: async ({ postcss }) => {
 *         // modify the PostCSS (superset of CSS) AST
 *     },
 * })
 * 
 * @param {object} param0
 * @param {string} param0.path
 * @param {function({ exists: boolean, posthtml: ReturnType<typeof newPosthtmlAst> }): Promise<{ exists: false } | { posthtml: ReturnType<typeof newPosthtmlAst> }>} [param0.markup]
 * @param {function({ exists: boolean, lang: ScriptLang, typeScriptEstree: ReturnType<typeof newTypeScriptEstreeAst> }): Promise<{ exists: false } | { lang: ScriptLang, typeScriptEstree: ReturnType<typeof newTypeScriptEstreeAst> }>} [param0.moduleScript]
 * @param {function({ exists: boolean, lang: ScriptLang, typeScriptEstree: ReturnType<typeof newTypeScriptEstreeAst> }): Promise<{ exists: false } | { lang: ScriptLang, typeScriptEstree: ReturnType<typeof newTypeScriptEstreeAst> }>} [param0.script]
 * @param {function({ exists: boolean, lang: StyleLang, postcss: ReturnType<typeof newPostcssAst> }): Promise<{ exists: false } | { lang: StyleLang, postcss: ReturnType<typeof newPostcssAst> }>} [param0.style]
 * @returns {Promise<void>}
 */
export const updateSvelte = async ({ path, markup, moduleScript, script, style }) => {
	await updateFile({
		path,
		content: async ({ exists, text }) => {
			let posthtml = newPosthtmlAst(text);
			
			if (markup) {
				const newMarkup = await markup({ exists, posthtml });
				if ("exists" in newMarkup) return { exists: false };

				posthtml = newMarkup.posthtml;
			}

			/** @type {import("posthtml-parser").NodeTag | undefined} */
			let tagModuleScript;
			/** @type {import("posthtml-parser").NodeTag | undefined} */
			let tagScript;
			/** @type {import("posthtml-parser").NodeTag | undefined} */
			let tagStyle;

			for (const node of posthtml) {
				if (typeof node === "string" || typeof node === "number") continue;

				if (node.tag === "script") {
					if (node.attrs?.["context"] === "module") {
						tagModuleScript = node;
					} else {
						tagScript = node;
					}
				} else if (node.tag === "style") {
					tagStyle = node;
				}
			}

			/**
			 * @template {"postcss" | "typeScriptEstree"} ASTArg
			 * @template {ReturnType<typeof newPostcssAst> | ReturnType<typeof newTypeScriptEstreeAst>} ASTType
			 * @template {ScriptLang | StyleLang} LangType
			 * @param {object} param0
			 * @param {ASTArg} param0.astArg
			 * @param {boolean} param0.beginning
			 * @param {import("posthtml-parser").NodeTag | undefined} param0.existingTag
			 * @param {import("posthtml-parser").NodeTag} param0.newTag
			 * @param {function(string): ASTType} param0.newAst
			 * @param {function(ASTType): string} param0.stringify
			 * @param {any} param0.updater // Was very painful to type and it didn't work anyway
			 * @returns {Promise<import("posthtml-parser").NodeTag | undefined>}
			 */
			const modify = async ({ astArg, beginning, existingTag, newAst, newTag, stringify, updater }) => {
				/** @type {LangType} */
				const lang = (existingTag?.attrs?.lang);
				const content = existingTag?.content;
				const text = Array.isArray(content) ? content.join("") : (content?.toString() ?? "");

				const newBlock = await updater({
					exists: existingTag !== undefined,
					lang,
					[astArg]: newAst(text),
				});

				if ("exists" in newBlock) {
					if (existingTag) posthtml.splice(posthtml.indexOf(existingTag, 1));

					return undefined;
				}

				if (!existingTag) {
					existingTag = newTag;

					if (beginning) posthtml.unshift(existingTag);
					else posthtml.push(existingTag);
				}

				if (!existingTag.attrs) existingTag.attrs = {};

				if (newBlock.lang) existingTag.attrs.lang = newBlock.lang;
				else delete existingTag.attrs.lang;

				existingTag.content = stringify(newBlock[astArg]);

				return existingTag;
			}

			if (script) tagScript = await modify({
				astArg: "typeScriptEstree",
				beginning: true,
				existingTag: tagScript,
				newAst: newTypeScriptEstreeAst,
				newTag: {
					tag: "script",
				},
				stringify: stringifyTypeScriptEstreeAst,
				updater: script,
			});

			if (moduleScript) tagModuleScript = await modify({
				astArg: "typeScriptEstree",
				beginning: true,
				existingTag: tagModuleScript,
				newAst: newTypeScriptEstreeAst,
				newTag: {
					tag: "script",
					attrs: {
						context: "module",
					}
				},
				stringify: stringifyTypeScriptEstreeAst,
				updater: moduleScript,
			});

			if (style) tagStyle = await modify({
				astArg: "postcss",
				beginning: true,
				existingTag: tagStyle,
				newAst: newPostcssAst,
				newTag: {
					tag: "style",
				},
				stringify: stringifyPostcssAst,
				updater: style,
			});
			
			return {
				text: stringifyPosthtmlAst(posthtml),
			};
		},
	})
};
