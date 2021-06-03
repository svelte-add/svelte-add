import { unlink, writeFile } from "fs/promises";
import { preprocess } from "svelte/compiler";

import { readFile } from "./index.js";
import { newPostcssAst, newTypeScriptEstreeAst, stringifyTypeScriptEstreeAst } from "./ast.js";

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
				text: out.postcss.toString(),
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

/**
 * 
 * Example:
 * await updateSvelte({ 
 *     path: "/path/to/project/src/lib/Counter.svelte",
 *     markup: async ({ posthtml }) => {
 *         // modify the PostHTML (superset of HTML) AST
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
 * TODO: markup and style
 * TODO: typedef lang as js | ts | coffeescript (?)
 * @param {function({ exists: boolean, lang: string, typeScriptEstree: ReturnType<typeof newTypeScriptEstreeAst> }): Promise<{ exists: false } | { lang: string, typeScriptEstree: ReturnType<typeof newTypeScriptEstreeAst> }>} param0.script
 * @returns {Promise<void>}
 */
export const updateSvelte = async ({ path, script }) => {
	await updateFile({
		path,
		content: async ({ text }) => {
			/** @type {string | undefined} */
			let newScriptLang;
			// TODO: redo this without the preprocess API because it's not actually a good fit
			let result = (await preprocess(text, [{
				async script({ attributes, content }) {
					
					const newScript = await script({
						exists: true,
						lang: /** @type {string} */ (attributes.lang),
						typeScriptEstree: newTypeScriptEstreeAst(content),
					});

					// TODO
					if ("exists" in newScript) return { code: "" };

					newScriptLang = newScript.lang;

					return {
						code: stringifyTypeScriptEstreeAst(newScript.typeScriptEstree),
					}
				},
			}])).code;

			if (!newScriptLang) {				
				const newScript = await script({
					exists: false,
					lang: "js",
					typeScriptEstree: newTypeScriptEstreeAst(""),
				});

				if ("exists" in newScript) {

				} else {
					newScriptLang = newScript.lang;
					const setLang = newScriptLang === "js" ? "" : ` lang="${newScriptLang}"`;
					result = `<script${setLang}>\n${stringifyTypeScriptEstreeAst(newScript.typeScriptEstree)}\n</script>\n\n${result}`;
				}
			}
			
			return {
				text: result,
			};
		},
	})
};
