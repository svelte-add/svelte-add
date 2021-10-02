import { walk } from "estree-walker";
import { Comment } from "postcss";
import { addImport, findImport, getConfigExpression, getPreprocessArray, getSveltePreprocessArgs, setDefault } from "./ast-tools.js";

/**
 * @param {object} param0
 * @param {import(".").FolderInfo} param0.folderInfo
 * @param {import(".").AdderRunArg<any>["updateJavaScript"]} param0.updateJavaScript
 * @param {function(import("estree").ObjectExpression, ReturnType<typeof import("./ast-io.js").newTypeScriptEstreeAst>, boolean): void} param0.mutateViteConfig
 */
export const updateViteConfig = async ({ folderInfo, updateJavaScript, mutateViteConfig }) => {
	if (folderInfo.kit) {
		const cjs = folderInfo.packageType !== "module";
		await updateJavaScript({
			path: cjs ? "/svelte.config.cjs" : "/svelte.config.js",
			async script({ typeScriptEstree }) {
				const svelteConfigObject = getConfigExpression({ cjs, typeScriptEstree });

				if (svelteConfigObject.type !== "ObjectExpression") throw new Error("Svelte config must be an object");

				const kitConfigObject = setDefault({
					default: {
						type: "ObjectExpression",
						properties: [],
					},
					object: svelteConfigObject,
					property: "kit",
				});

				if (kitConfigObject.type !== "ObjectExpression") throw new Error("kit in Svelte config must be an object");

				const viteConfigObject = setDefault({
					default: {
						type: "ObjectExpression",
						properties: [],
					},
					object: kitConfigObject,
					property: "vite",
				});

				if (viteConfigObject.type !== "ObjectExpression") throw new Error("vite in kit in Svelte config must be an object");

				mutateViteConfig(viteConfigObject, typeScriptEstree, cjs);

				return {
					typeScriptEstree,
				};
			},
		});
	} else {
		await updateJavaScript({
			path: "/vite.config.js",
			async script({ typeScriptEstree }) {
				const viteConfigObjectOrCall = getConfigExpression({ cjs: false, typeScriptEstree });

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
	}
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

			const svelteConfigObject = getConfigExpression({ cjs, typeScriptEstree });
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

				/** @type {import("estree").ImportDeclaration} */
				// prettier-ignore
				const importDeclaration = (node)

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
			path: "/src/routes/__layout.svelte",

			async markup({ posthtml }) {
				const slot = posthtml.some((node) => typeof node !== "string" && typeof node !== "number" && node.tag === "slot");

				if (!slot) posthtml.push("\n", { tag: "slot" });

				return {
					posthtml,
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

/**
 * @param {object} param0
 * @param {string} param0.packageName
 * @param {import(".").FolderInfo} param0.folderInfo
 * @param {import(".").AdderRunArg<any>["updateJavaScript"]} param0.updateJavaScript
 */
export const addSvelteAdapter = async ({ packageName, folderInfo, updateJavaScript }) => {
	const cjs = folderInfo.packageType !== "module";

	/**
	 * @param {object} param0
	 * @param {string} param0.packageName
	 * @param {boolean} param0.cjs
	 * @param {import("./ast-io.js").RecastAST} param0.typeScriptEstree
	 */
	const updateAdapter = ({ typeScriptEstree, cjs, packageName }) => {
		let adapterImportedAs = findImport({ cjs, package: packageName, typeScriptEstree }).default;

		// Add an adapter import if it's not there
		if (!adapterImportedAs) {
			adapterImportedAs = "adapter";
			addImport({ cjs, package: packageName, default: adapterImportedAs, typeScriptEstree });
		}

		// get the svelte config object
		const svelteConfigObject = getConfigExpression({ cjs, typeScriptEstree });
		if (svelteConfigObject.type !== "ObjectExpression") throw new Error("Svelte config must be an object");

		// get the kit property
		/** @type {import("estree").Property | undefined} */
		let kitProperty;
		for (const property of svelteConfigObject.properties) {
			if (property.type !== "Property") continue;
			if (property.key.type !== "Identifier") continue;
			if (property.key.name === "kit") kitProperty = property;
		}

		if (!kitProperty) throw new Error("Kit config must be present");
		if (kitProperty.value.type !== "ObjectExpression") throw new Error("Kit config must be an object");

		// get the content of the kit property
		/** @type {import("estree").ObjectExpression | undefined} */
		const kitObjectExpression = kitProperty.value;

		/** @type {import("estree").Property | undefined} */
		let adapterProperty;
		for (const property of kitObjectExpression.properties) {
			if (property.type !== "Property") continue;
			if (property.key.type !== "Identifier") continue;
			if (property.key.name === "adapter") adapterProperty = property;
		}

		// Add the adapter property to the kit object if missing
		if (!adapterProperty) {
			/** @type {import("estree").CallExpression} */
			const adapterCallExpression = {
				type: "CallExpression",
				// @ts-ignore - I am not sure why this is typed wrongly (?)
				arguments: [],
				callee: {
					type: "Identifier",
					name: adapterImportedAs,
				},
				optional: false,
			};

			/** @type {import("estree").Identifier} */
			const adapterIdentifier = {
				type: "Identifier",
				name: "adapter",
			};

			/** @type {import("estree").Property} */
			const adapterProperty = {
				type: "Property",
				value: adapterCallExpression,
				key: adapterIdentifier,
				shorthand: false,
				computed: false,
				method: false,
				kind: "init",
			};

			kitObjectExpression.properties.push(adapterProperty);
		}

		return typeScriptEstree;
	};

	await updateJavaScript({
		path: cjs ? "/svelte.config.cjs" : "/svelte.config.js",
		async script({ typeScriptEstree }) {
			return {
				typeScriptEstree: updateAdapter({ typeScriptEstree, cjs, packageName }),
			};
		},
	});
};
