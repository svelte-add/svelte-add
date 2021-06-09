// @ts-nocheck
import { walk } from "estree-walker";
import { newPostcssAst, newTypeScriptEstreeAst } from "../../ast.js";

// TODO: only include autoprefixer and cssnano with examples
const postcssConfig = `
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");

const mode = process.env.NODE_ENV;
const dev = mode === "development";

const config = {
	plugins: [
		autoprefixer(),

		!dev && cssnano({
			preset: "default",
		}),
	],
};

module.exports = config;
`;

/**
 * 
 * @param {import("../../ast.js").RecastAST} svelteConfigAst
 * @param {boolean} cjs
 * @returns {import("../../ast.js").RecastAST}
 */
const updateSvelteConfig = (svelteConfigAst, cjs) => {
	/** @type {string | undefined} */
	let sveltePreprocessImportedAs;

	// Try to find what svelte-preprocess is imported as
	// (it is different between SvelteKit (`preprocess`) and Vite (`sveltePreprocess`))
	// https://github.com/svelte-add/postcss/issues/21
	walk(svelteConfigAst, {
		enter(node) {
			if (cjs) {
				if (node.type !== "VariableDeclarator") return;

				/** @type {import("estree").VariableDeclarator} */
				const declarator = (node);
				
				if (declarator.id.type !== "Identifier") return;
				/** @type {import("estree").Identifier} */
				const identifier = (declarator.id);
				
				if (declarator.init.type !== "CallExpression") return;
				/** @type {import("estree").CallExpression} */
				const callExpression = (declarator.init);

				if (callExpression.callee.type !== "Identifier") return;
				/** @type {import("estree").Identifier} */
				const callee = (callExpression.callee);

				if (callee.name !== "require") return;

				if (callExpression.arguments[0].type !== "Literal") return;
				if (callExpression.arguments[0].value !== "svelte-preprocess") return;

				sveltePreprocessImportedAs = identifier.name;
			} else {
				if (node.type !== "ImportDeclaration") return;

				/** @type {import("estree").ImportDeclaration} */
				const importDeclaration = (node);
				
				if (importDeclaration.source.value !== "svelte-preprocess") return;
				
				for (const specifier of importDeclaration.specifiers) {
					if (specifier.type === "ImportDefaultSpecifier") sveltePreprocessImportedAs = specifier.local.name;
				}
			}
		},
	});

	// Add a svelte-preprocess import if it's not there
	if (!sveltePreprocessImportedAs) {
		sveltePreprocessImportedAs = "preprocess";
		if (cjs) {
			/** @type {import("estree").VariableDeclaration} */
			const requireSveltePreprocessAst = {
				type: "VariableDeclaration",
				declarations: [
					{
						type: "VariableDeclarator",
						id: {
							type: "Identifier",
							name: sveltePreprocessImportedAs,
						},
						init: {
							type: "CallExpression",
							callee: {
								type: "Identifier",
								name: "require",
							},
							arguments: [
								{
									type: "Literal",
									value: "svelte-preprocess",
								},
							]
						}
					}
				],
				kind: "const",
			};

			svelteConfigAst.program.body.unshift(requireSveltePreprocessAst);
		} else {
			const importSveltePreprocessAst = newTypeScriptEstreeAst(`import ${sveltePreprocessImportedAs} from 'svelte-preprocess';`);
			svelteConfigAst.program.body.unshift(importSveltePreprocessAst.program.body[0]);
		}
	}
	
	// Try to find the exported config object
	/** @type {import("estree").ObjectExpression | undefined} */
	let configObject;
	walk(svelteConfigAst, {
		enter(node, parent) {
			if (cjs) {
				if (node.type !== "AssignmentExpression") return;
				/** @type {import("estree").AssignmentExpression} */
				const assignmentExpression = (node);

				if (assignmentExpression.left.type !== "MemberExpression") return;
				/** @type {import("estree").MemberExpression} */
				const memberExpression = (assignmentExpression.left);

				if (memberExpression.object.name !== "module") return;
				if (memberExpression.property.name !== "exports") return;
				
				configObject = assignmentExpression.right;
			} else {
				if (node.type !== "ExportDefaultDeclaration") return;
				
				/** @type {import("estree").ExportDefaultDeclaration} */
				const exportDefault = (node);
				/** @type {import("estree").Identifier} */
				const exportDefaultDeclaration = (exportDefault.declaration);
				const configObjectVariable = exportDefaultDeclaration.name;

				walk(svelteConfigAst, {
					enter(node2) {
						if (node2.type !== "VariableDeclarator") return;

						/** @type {import("estree").VariableDeclarator} */
						const variableDeclarator = (node2);

						if (variableDeclarator.id.type === "Identifier" && variableDeclarator.id.name === configObjectVariable) {
							/** @type {import("estree").ObjectExpression} */
							const init = (variableDeclarator.init);
							configObject = init;
						}
					},
				});
			}
		},
	});

	if (!configObject) {
		if (cjs) {
			configObject = {
				type: "ObjectExpression",
				properties: [],
			}

			/** @type {import("estree").ExpressionStatement} */
			const exportConfig = {
				type: "ExpressionStatement",
				expression: {
					type: "AssignmentExpression",
					operator: "=",
					left: {
						type: "MemberExpression",
						object: {
							type: "Identifier",
							name: "module",
						},
						property: {
							type: "Identifier",
							name: "exports",
						},
						computed: false,
						optional: false,
					},
					right: configObject,
				}
			};

			svelteConfigAst.program.body.push(exportConfig)
		} else {
			// TODO
		}
	}
	
	// Try to find preprocess config
	/** @type {import("estree").Property | undefined} */
	let preprocessConfig;
	for (const property of configObject.properties) {
		if (property.key.type !== "Identifier") continue;
		if (property.key.name === "preprocess") preprocessConfig = property;
	}
	// Or set it to svelte-preprocess() if it doesn't exist
	if (!preprocessConfig) {
		/** @type {import("estree").ExpressionStatement} */
		const setConfigWithPreprocessExpressionStatement = (newTypeScriptEstreeAst(`_ = { preprocess: ${sveltePreprocessImportedAs}() }`).program.body[0]);
		/** @type {import("estree").AssignmentExpression} */
		const setConfigWithPreprocessExpression = (setConfigWithPreprocessExpressionStatement.expression);
		/** @type {import("estree").ObjectExpression} */
		const configWithPreprocess = (setConfigWithPreprocessExpression.right);
		preprocessConfig = configWithPreprocess.properties[0];
		configObject.properties.push(preprocessConfig);
	}
	// Convert preprocess config from a single svelte-preprocess() function call to an array [svelte-preprocess()]
	if (preprocessConfig.value.type !== "ArrayExpression") {
		/** @type {import("estree").ExpressionStatement} */
		const arrayExpressionStatement = (newTypeScriptEstreeAst("[]").program.body[0]);
		/** @type {import("estree").ArrayExpression} */
		const array = (arrayExpressionStatement.expression);
		/** @type {import("estree").CallExpression} */
		const preprocessConfigValue = (preprocessConfig.value);
		array.elements.push(preprocessConfigValue);
		preprocessConfig.value = array;
	}
	
	// Add postcss: true to svelte-preprocess options
	for (const element of preprocessConfig.value.elements) {
		if (element.type !== "CallExpression") continue;
		if (element.callee.type !== "Identifier") continue;
		if (element.callee.name !== sveltePreprocessImportedAs) continue;

		// Initialize the options as {} if none were passed
		if (element.arguments.length === 0) {
			/** @type {import("estree").ObjectExpression} */
			const emptyObject = {
				type: "ObjectExpression",
				properties: [],
			}

			element.arguments.push(emptyObject);
		}

		/** @type {import("estree").ObjectExpression} */
		const sveltePreprocessArgs = (element.arguments[0]);

		/** @type {import("estree").ObjectExpression} */
		const objPostcssTrue = {
			type: "ObjectExpression",
			properties: [{
				computed: false,
				key: {
					type: "Literal",
					value: "postcss",
				},
				kind: "init",
				type: "Property",
				method: false,
				shorthand: false,
				value: {
					type: "Literal",
					value: true,
				},
			}]
		}

		sveltePreprocessArgs.properties.push(...objPostcssTrue.properties)
	}

	return svelteConfigAst;
}


/** @type {import("../..").AdderRun<{}>} */
export const run = async ({ environment, install, updateCss, updateJavaScript, updateSvelte }) => {
	await updateJavaScript({
		path: "/postcss.config.cjs",
		async script({ typeScriptEstree }) {
			const postcssConfigAst = newTypeScriptEstreeAst(postcssConfig);

			typeScriptEstree.program.body = postcssConfigAst.program.body;

			return {
				typeScriptEstree,
			}
		}
	});
	
	await updateJavaScript({
		path: "/svelte.config.js",
		async script({ exists, typeScriptEstree }) {
			if (!exists) return { exists: false };

			return {
				typeScriptEstree: updateSvelteConfig(typeScriptEstree, false),
			}
		}
	});
	
	await updateJavaScript({
		path: "/svelte.config.cjs",
		async script({ exists, typeScriptEstree }) {
			if (!exists) {
				if (environment.kit || environment.bundler !== "vite") return { exists: false };
			}
			
			return {
				typeScriptEstree: updateSvelteConfig(typeScriptEstree, true),
			}
		}
	});

	await updateCss({
		path: "/src/app.css",
		async style({ postcss: appCss }) {
			await updateCss({
				path: "/src/app.postcss",
				async style({ postcss: appPostcss }) {
					appPostcss.prepend(appCss);

					appPostcss.prepend(newPostcssAst("/* Write your global styles here, in PostCSS syntax */"));

					return {
						postcss: appPostcss,
					};
				}
			});

			return {
				exists: false,
			};
		}
	});

	const updateOrAddAppStylesImport = ({ typeScriptEstree, inputs, output }) => {
		/** @type {import("estree").ImportDeclaration | undefined} */
		let appStylesImport;

		walk(typeScriptEstree, {
			enter(node) {
				if (node.type !== "ImportDeclaration") return;

				/** @type {import("estree").ImportDeclaration} */
				const importDeclaration = (node);
				
				if (!inputs.includes(importDeclaration.source.value)) return;

				appStylesImport = importDeclaration;
			}
		});

		if (!appStylesImport) {
			appStylesImport = {
				type: "ImportDeclaration",
				source: {
					type: "Literal",
					value: output,
				},
				specifiers: [],
			}
			typeScriptEstree.program.body.unshift(appStylesImport);
		}

		appStylesImport.source.value = output;
	};

	if (environment.kit) await updateSvelte({
		path: "/src/routes/__layout.svelte",

		async markup({ posthtml }) {
			const slot = posthtml.some(node => node.tag === "slot");

			if (!slot) posthtml.push("\n", { tag: "slot" });

			return {
				posthtml,
			};
		},

		async script({ lang, typeScriptEstree }) {
			updateOrAddAppStylesImport({ typeScriptEstree, inputs: ["../app.css"], output: "../app.postcss" });

			return {
				lang,
				typeScriptEstree,
			};
		},
	});
	else {
		await updateJavaScript({
			path: "/src/main.js",
			async script({ exists, typeScriptEstree }) {
				if (!exists) return { exists: false };

				updateOrAddAppStylesImport({ typeScriptEstree, inputs: ["./app.css"], output: "./app.postcss" });
				return { typeScriptEstree };
			}
		});

		await updateJavaScript({
			path: "/src/main.ts",
			async script({ exists, typeScriptEstree }) {
				if (!exists) return { exists: false };

				updateOrAddAppStylesImport({ typeScriptEstree, inputs: ["./app.css"], output: "./app.postcss" });
				return { typeScriptEstree };
			}
		});
	}

	await install({ dev: true, package: "postcss" });
	await install({ dev: true, package: "postcss-load-config" });
	await install({ dev: true, package: "svelte-preprocess" });
	
	// TODO: move this to examples only
	await install({ dev: true, package: "autoprefixer" });
	await install({ dev: true, package: "cssnano" });
};
