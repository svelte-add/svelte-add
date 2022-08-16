import { Element } from "domhandler";
import { appendChild, existsOne } from "domutils";
import { walk } from "estree-walker";
import { ElementType } from "htmlparser2";
import { Comment } from "postcss";
import { addImport, findImport, setDefaultDefaultExport, getPreprocessArray, getSveltePreprocessArgs } from "./ast-tools.js";

/**
 * @param {object} param0
 * @param {import(".").AdderRunArg<any>["updateJavaScript"]} param0.updateJavaScript
 * @param {function(import("estree").ObjectExpression, ReturnType<typeof import("./ast-io.js").newTypeScriptEstreeAst>, boolean): void} param0.mutateViteConfig
 */
export const updateViteConfig = async ({ updateJavaScript, mutateViteConfig }) => {
	await updateJavaScript({
		path: "/vite.config.js",
		async script({ typeScriptEstree }) {
			const viteConfigObjectOrCall = setDefaultDefaultExport({
				cjs: false,
				defaultValue: {
					type: "ObjectExpression",
					properties: [],
				},
				typeScriptEstree,
			});

			if (viteConfigObjectOrCall.type === "ObjectExpression") {
				mutateViteConfig(viteConfigObjectOrCall, typeScriptEstree, false);
			} else if (viteConfigObjectOrCall.type === "CallExpression") {
				const configObject = viteConfigObjectOrCall.arguments[0];
				if (configObject.type !== "ObjectExpression") throw new Error("argument passed to vite defineConfig needs to be an object");
				mutateViteConfig(configObject, typeScriptEstree, false);
			} else {
				throw new Error("vite config needs to be an object or defineConfig called on an object");
			}

			return {
				typeScriptEstree,
			};
		},
	});
};

/**
 *
 * @param {object} param0
 * @param {import(".").FolderInfo} param0.folderInfo
 * @param {function(import("estree").ObjectExpression): void} param0.mutateSveltePreprocessArgs
 * @param {import(".").AdderRunArg<any>["updateJavaScript"]} param0.updateJavaScript
 */
export const updateSveltePreprocessArgs = async ({ folderInfo, mutateSveltePreprocessArgs, updateJavaScript }) => {
	const cjs = folderInfo.packageType !== "module";
	await updateJavaScript({
		path: cjs ? "/svelte.config.cjs" : "/svelte.config.js",
		async script({ typeScriptEstree }) {
			const sveltePreprocessImports = findImport({ cjs, package: "svelte-preprocess", typeScriptEstree });
			let sveltePreprocessImportedAs = cjs ? sveltePreprocessImports.require : sveltePreprocessImports.default;

			// Add a svelte-preprocess import if it's not there
			if (!sveltePreprocessImportedAs) {
				sveltePreprocessImportedAs = "preprocess";
				addImport({ require: sveltePreprocessImportedAs, cjs, default: sveltePreprocessImportedAs, package: "svelte-preprocess", typeScriptEstree });
			}

			const svelteConfigObject = setDefaultDefaultExport({
				cjs,
				defaultValue: {
					type: "ObjectExpression",
					properties: [],
				},
				typeScriptEstree,
			});
			if (svelteConfigObject.type !== "ObjectExpression") throw new Error("Svelte config must be an object");

			const preprocessArray = getPreprocessArray({ configObject: svelteConfigObject });
			const sveltePreprocessArgs = getSveltePreprocessArgs({ preprocessArray, sveltePreprocessImportedAs });

			mutateSveltePreprocessArgs(sveltePreprocessArgs);

			return {
				typeScriptEstree,
			};
		},
	});
};

/**
 * @param {object} param0
 * @param {string} param0.extension
 * @param {import(".").FolderInfo} param0.folderInfo
 * @param {function(import("estree").ObjectExpression): void} param0.mutateSveltePreprocessArgs
 * @param {string} param0.stylesHint
 * @param {import(".").AdderRunArg<any>["updateCss"]} param0.updateCss
 * @param {import(".").AdderRunArg<any>["updateJavaScript"]} param0.updateJavaScript
 * @param {import(".").AdderRunArg<any>["updateSvelte"]} param0.updateSvelte
 */
export const setupStyleLanguage = async ({ extension, folderInfo, stylesHint, updateCss, updateJavaScript, updateSvelte, mutateSveltePreprocessArgs }) => {
	await updateSveltePreprocessArgs({
		folderInfo,
		mutateSveltePreprocessArgs,
		updateJavaScript,
	});

	/** @param {ReturnType<typeof import("./ast-io").newPostcssAst>} newCss */
	const addStyleHint = (newCss) => {
		newCss.prepend(
			new Comment({
				text: stylesHint,
			})
		);
	};

	await updateCss({
		path: "/src/app.css",
		async style({ postcss: oldCss }) {
			if (extension === "css") {
				addStyleHint(oldCss);
				return { postcss: oldCss };
			}

			await updateCss({
				path: `/src/app.${extension}`,
				async style({ postcss: newCss }) {
					newCss.prepend(oldCss);
					addStyleHint(newCss);
					return { postcss: newCss };
				},
			});

			return {
				exists: false,
			};
		},
	});

	/**
	 * @param {object} param0
	 * @param {import("./ast-io.js").RecastAST} param0.typeScriptEstree
	 * @param {string[]} param0.inputs
	 * @param {string} param0.output
	 */
	const updateOrAddAppStylesImport = ({ typeScriptEstree, inputs, output }) => {
		/** @type {import("estree").ImportDeclaration | undefined} */
		let appStylesImport;

		walk(typeScriptEstree, {
			enter(node) {
				if (node.type !== "ImportDeclaration") return;

				const importDeclaration = /** @type {import("estree").ImportDeclaration} */ (node);

				if (typeof importDeclaration.source.value !== "string") return;

				if (!inputs.includes(importDeclaration.source.value)) return;

				appStylesImport = importDeclaration;
			},
		});

		if (!appStylesImport) {
			appStylesImport = {
				type: "ImportDeclaration",
				source: {
					type: "Literal",
					value: output,
				},
				specifiers: [],
			};
			typeScriptEstree.program.body.unshift(appStylesImport);
		}

		appStylesImport.source.value = output;
	};

	if (folderInfo.kit)
		await updateSvelte({
			path: "/src/routes/+layout.svelte",

			async markup({ domhandler }) {
				const hasSlot = existsOne((tag) => tag.type === ElementType.Tag && tag.tagName === "slot", domhandler.childNodes);

				if (!hasSlot) {
					const slot = new Element("slot", {});

					const root = /** @type {import("domhandler").Element}*/ (/** @type {unknown} */ (domhandler));
					appendChild(root, slot);
				}

				return {
					domhandler,
				};
			},

			async script({ lang, typeScriptEstree }) {
				updateOrAddAppStylesImport({
					typeScriptEstree,
					inputs: ["../app.css"],
					output: `../app.${extension}`,
				});

				return {
					lang,
					typeScriptEstree,
				};
			},
		});
	else {
		for (const mainFile of ["/src/main.js", "/src/main.ts"]) {
			await updateJavaScript({
				path: mainFile,
				async script({ exists, typeScriptEstree }) {
					if (!exists) return { exists: false };

					updateOrAddAppStylesImport({
						typeScriptEstree,
						inputs: ["./app.css"],
						output: `./app.${extension}`,
					});
					return { typeScriptEstree };
				},
			});
		}
	}
};
