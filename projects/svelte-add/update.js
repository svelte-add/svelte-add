import { mkdir, unlink, writeFile } from "fs/promises";
import { parse } from "path";
import { ElementType } from "htmlparser2";
import { appendChild, prependChild, removeElement, textContent } from "domutils";
import { Element, Text } from "domhandler";
import prettier from "prettier";
import { readFile } from "./index.js";
import { newPostcssAst, newDomHandlerAst, newTypeScriptEstreeAst, stringifyPostcssAst, stringifyDomHandlerAst, stringifyTypeScriptEstreeAst } from "./ast-io.js";

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
		} catch (/** @type {any} */ e) {
			if (e.code !== "ENOENT") throw e;
		}
		return;
	}

	await mkdir(parse(path).dir, {
		recursive: true,
	});

	const options = await prettier.resolveConfig(path);
	let formatted = out.text;

	try {
		formatted = await prettier.format(out.text, {
			...options,
			filepath: path,
		});
	} catch (e) {
		try {
			formatted = await prettier.format(out.text, {
				...options,
				filepath: path,
				plugins: ["prettier-plugin-svelte"],
			});
		} catch (e) {
			// This can fail and we don't really care (it's just formatting)
		}
	}

	await writeFile(path, formatted, {
		encoding: "utf-8",
	});
};

/**
 * Example:
 * await updateCss({
 *     path: "/path/to/project/src/app.pcss",
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
	});
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
 * @param {function({ exists: boolean, typeScriptEstree: import("./ast-io.js").RecastAST }): Promise<{ exists: false } | { typeScriptEstree: import("./ast-io.js").RecastAST }>} param0.script
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
	});
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
 * @param {function({ exists: boolean, domhandler: import("./ast-io.js").DomHandlerAst }): Promise<{ exists: false } | { domhandler: import("./ast-io.js").DomHandlerAst }>} [param0.markup]
 * @param {function({ exists: boolean, lang: ScriptLang, typeScriptEstree: import("./ast-io.js").RecastAST }): Promise<{ exists: false } | { lang: ScriptLang, typeScriptEstree: import("./ast-io.js").RecastAST }>} [param0.moduleScript]
 * @param {function({ exists: boolean, lang: ScriptLang, typeScriptEstree: import("./ast-io.js").RecastAST }): Promise<{ exists: false } | { lang: ScriptLang, typeScriptEstree: import("./ast-io.js").RecastAST }>} [param0.script]
 * @param {function({ exists: boolean, lang: StyleLang, postcss: ReturnType<typeof newPostcssAst> }): Promise<{ exists: false } | { lang: StyleLang, postcss: ReturnType<typeof newPostcssAst> }>} [param0.style]
 * @returns {Promise<void>}
 */
export const updateSvelte = async ({ path, markup, moduleScript, script, style }) => {
	await updateFile({
		path,
		content: async ({ exists, text }) => {
			let domhandler = newDomHandlerAst(text);

			if (markup) {
				const newMarkup = await markup({ exists, domhandler });
				if ("exists" in newMarkup) return { exists: false };

				domhandler = newMarkup.domhandler;
			}

			/** @type {import("domhandler").Element | undefined} */
			let tagModuleScript;
			/** @type {import("domhandler").Element | undefined} */
			let tagScript;
			/** @type {import("domhandler").Element | undefined} */
			let tagStyle;

			// Only check top level elements
			for (const node of domhandler.childNodes) {
				if (node.type === ElementType.Script) {
					const element = /** @type {import("domhandler").Element} */ (node);

					if (element.attribs["context"] === "module") {
						tagModuleScript = element;
					} else {
						tagScript = element;
					}
				} else if (node.type === ElementType.Style) {
					const element = /** @type {import("domhandler").Element} */ (node);

					tagStyle = element;
				}
			}

			/**
			 * @template {"postcss" | "typeScriptEstree"} ASTArg
			 * @template {ReturnType<typeof newPostcssAst> | import("./ast-io.js").RecastAST} ASTType
			 * @template {ScriptLang | StyleLang} LangType
			 * @param {object} param0
			 * @param {ASTArg} param0.astArg
			 * @param {boolean} param0.beginning
			 * @param {import("domhandler").Element | undefined} param0.existingTag
			 * @param {import("domhandler").Element} param0.newTag
			 * @param {function(string): ASTType} param0.newAst
			 * @param {function(ASTType): string} param0.stringify
			 * @param {any} param0.updater // Was very painful to type and it didn't work anyway
			 * @returns {Promise<import("domhandler").Element | undefined>}
			 */
			const modify = async ({ astArg, beginning, existingTag, newAst, newTag, stringify, updater }) => {
				const lang = /** @type {LangType} */ (existingTag?.attribs.lang);
				const text = existingTag ? textContent(existingTag) : "";

				const newBlock = await updater({
					exists: existingTag !== undefined,
					lang,
					[astArg]: newAst(text),
				});

				if ("exists" in newBlock) {
					if (existingTag) removeElement(existingTag);

					return undefined;
				}

				/** @type {import("domhandler").Element} */
				let tag;

				if (existingTag) {
					tag = existingTag;
				} else {
					tag = newTag;

					const root = /** @type {import("domhandler").Element}*/ (/** @type {unknown} */ (domhandler));

					if (beginning) prependChild(root, tag);
					else appendChild(root, tag);
				}

				if (newBlock.lang) tag.attribs.lang = newBlock.lang;
				else delete tag.attribs.lang;

				for (const child of tag.children) {
					removeElement(child);
				}

				appendChild(tag, new Text(stringify(newBlock[astArg])));

				return existingTag;
			};

			if (script)
				// TODO: add to html if needed
				// eslint-disable-next-line no-unused-vars
				tagScript = await modify({
					astArg: "typeScriptEstree",
					beginning: true,
					existingTag: tagScript,
					newAst: newTypeScriptEstreeAst,
					newTag: new Element("script", {}),
					stringify: stringifyTypeScriptEstreeAst,
					updater: script,
				});

			if (moduleScript)
				// TODO: add to html if needed
				// eslint-disable-next-line no-unused-vars
				tagModuleScript = await modify({
					astArg: "typeScriptEstree",
					beginning: true,
					existingTag: tagModuleScript,
					newAst: newTypeScriptEstreeAst,
					newTag: new Element("script", { context: "module" }),
					stringify: stringifyTypeScriptEstreeAst,
					updater: moduleScript,
				});

			if (style)
				// TODO: add to html if needed
				// eslint-disable-next-line no-unused-vars
				tagStyle = await modify({
					astArg: "postcss",
					beginning: true,
					existingTag: tagStyle,
					newAst: newPostcssAst,
					newTag: new Element("style", {}),
					stringify: stringifyPostcssAst,
					updater: style,
				});

			return {
				text: stringifyDomHandlerAst(domhandler),
			};
		},
	});
};
