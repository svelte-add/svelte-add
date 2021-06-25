import { walk } from "estree-walker";

/**
 *
 * @param {object} param0
 * @param {boolean} param0.cjs
 * @param {import("./ast-io.js").RecastAST} param0.typeScriptEstree
 * @returns {import("estree").ObjectExpression}
 */
export const getConfigObject = ({ cjs, typeScriptEstree }) => {
	/** @type {string | undefined} */
	let configObjectVariable;

	/** @type {import("estree").ObjectExpression | undefined} */
	let configObjectExpression;

	// Try to find the exported config object
	walk(typeScriptEstree, {
		enter(node) {
			if (cjs) {
				if (node.type !== "AssignmentExpression") return;
				/** @type {import("estree").AssignmentExpression} */
				// prettier-ignore
				const assignmentExpression = (node)

				const assigningTo = assignmentExpression.left;
				if (assigningTo.type !== "MemberExpression") return;

				if (assigningTo.object.type !== "Identifier") return;
				if (assigningTo.object.name !== "module") return;

				if (assigningTo.property.type !== "Identifier") return;
				if (assigningTo.property.name !== "exports") return;

				const assignedTo = assignmentExpression.right;
				if (assignedTo.type === "ObjectExpression") {
					configObjectExpression = assignedTo;
				} else if (assignedTo.type === "Identifier") {
					configObjectVariable = assignedTo.name;
				}
			} else {
				if (node.type !== "ExportDefaultDeclaration") return;

				/** @type {import("estree").ExportDefaultDeclaration} */
				// prettier-ignore
				const exportDefault = (node)

				const exportDefaultDeclaration = exportDefault.declaration;

				if (exportDefaultDeclaration.type !== "Identifier") return;
				configObjectVariable = exportDefaultDeclaration.name;
			}
		},
	});

	if (!configObjectExpression) {
		if (!configObjectVariable) {
			configObjectExpression = {
				type: "ObjectExpression",
				properties: [],
			};

			configObjectVariable = "config";

			/** @type {import("estree").VariableDeclaration} */
			const declareConfig = {
				type: "VariableDeclaration",
				declarations: [
					{
						type: "VariableDeclarator",
						id: {
							type: "Identifier",
							name: configObjectVariable,
						},
						init: configObjectExpression,
					},
				],
				kind: "const",
			};

			typeScriptEstree.program.body.push(declareConfig);

			if (cjs) {
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
						right: {
							type: "Identifier",
							name: configObjectVariable,
						},
					},
				};

				typeScriptEstree.program.body.push(exportConfig);
			} else {
				/** @type {import("estree").ExportDefaultDeclaration} */
				const exportConfig = {
					"type": "ExportDefaultDeclaration",
					declaration: {
						type: "Identifier",
						name: configObjectVariable,
					}
				};
				typeScriptEstree.program.body.push(exportConfig);
			}
		}

		walk(typeScriptEstree, {
			enter(node) {
				if (node.type !== "VariableDeclarator") return;

				/** @type {import("estree").VariableDeclarator} */
				// prettier-ignore
				const variableDeclarator = (node)

				if (variableDeclarator.id.type === "Identifier" && variableDeclarator.id.name === configObjectVariable) {
					const init = variableDeclarator.init;
					if (!init) return;
					if (init.type !== "ObjectExpression") return;
					configObjectExpression = init;
				}
			},
		});
	}

	if (!configObjectExpression) throw new Error(`TODO: make this work`);

	return configObjectExpression;
};

/**
 *
 * @param {object} param0
 * @param {boolean} param0.cjs
 * @param {string} param0.package
 * @param {import("./ast-io.js").RecastAST} param0.typeScriptEstree
 * @returns {string | undefined}
 */
export const findImport = ({ cjs, package: pkg, typeScriptEstree }) => {
	/** @type {string | undefined} */
	let packageImportedAs;

	walk(typeScriptEstree, {
		enter(node) {
			if (cjs) {
				if (node.type !== "VariableDeclarator") return;

				/** @type {import("estree").VariableDeclarator} */
				// prettier-ignore
				const declarator = (node)

				if (declarator.id.type !== "Identifier") return;
				const identifier = declarator.id;

				if (!declarator.init) return;
				if (declarator.init.type !== "CallExpression") return;
				const callExpression = declarator.init;

				if (callExpression.callee.type !== "Identifier") return;
				const callee = callExpression.callee;

				if (callee.name !== "require") return;

				if (callExpression.arguments[0].type !== "Literal") return;
				if (callExpression.arguments[0].value !== pkg) return;

				packageImportedAs = identifier.name;
			} else {
				if (node.type !== "ImportDeclaration") return;

				/** @type {import("estree").ImportDeclaration} */
				// prettier-ignore
				const importDeclaration = (node)

				if (importDeclaration.source.value !== pkg) return;

				for (const specifier of importDeclaration.specifiers) {
					if (specifier.type === "ImportDefaultSpecifier") packageImportedAs = specifier.local.name;
				}
			}
		},
	});

	return packageImportedAs;
};

/**
 *
 * @param {object} param0
 * @param {string} param0.all
 * @param {boolean} param0.cjs
 * @param {string} param0.default
 * @param {string} param0.package
 * @param {import("./ast-io.js").RecastAST} param0.typeScriptEstree
 * @returns {void}
 */
export const addImport = ({ all, cjs, default: default_, package: pkg, typeScriptEstree }) => {
	if (cjs) {
		/** @type {import("estree").VariableDeclaration} */
		const requirePackageAst = {
			type: "VariableDeclaration",
			declarations: [
				{
					type: "VariableDeclarator",
					id: {
						type: "Identifier",
						name: all,
					},
					init: {
						type: "CallExpression",
						// @ts-ignore - I am not sure why this is typed wrongly (?)
						arguments: [
							{
								type: "Literal",
								value: pkg,
							},
						],
						callee: {
							type: "Identifier",
							name: "require",
						},
						optional: false,
					},
				},
			],
			kind: "const",
		};

		typeScriptEstree.program.body.unshift(requirePackageAst);
	} else {
		/** @type {import("estree").ImportDeclaration} */
		const importPackageAst = {
			type: "ImportDeclaration",
			source: {
				type: "Literal",
				value: pkg,
			},
			specifiers: [
				{
					type: "ImportDefaultSpecifier",
					local: {
						type: "Identifier",
						name: default_,
					},
				},
			],
		};

		typeScriptEstree.program.body.unshift(importPackageAst);
	}
};

/**
 *
 * @param {object} param0
 * @param {import("estree").ObjectExpression} param0.configObject
 * @returns {import("estree").ArrayExpression}
 */
export const getPreprocessArray = ({ configObject }) => {
	// Try to find preprocess config
	/** @type {import("estree").Property | undefined} */
	let preprocessConfig;
	for (const property of configObject.properties) {
		if (property.type !== "Property") continue;
		if (property.key.type !== "Identifier") continue;
		if (property.key.name !== "preprocess") continue;

		preprocessConfig = property;
	}
	// Or set it to an empty array if it doesn't exist
	if (!preprocessConfig) {
		preprocessConfig = {
			type: "Property",
			computed: false,
			key: {
				type: "Identifier",
				name: "preprocess",
			},
			kind: "init",
			method: false,
			shorthand: false,
			value: {
				type: "ArrayExpression",
				elements: [],
			},
		};
		configObject.properties.push(preprocessConfig);
	}

	if (preprocessConfig.value.type !== "ArrayExpression") {
		// Convert preprocess config from a single function call to an array e.x. [svelte-preprocess()]
		/** @type {import("estree").ArrayExpression} */
		const preprocessArray = {
			type: "ArrayExpression",
			elements: [],
		};
		if (preprocessConfig.value.type !== "CallExpression") throw new TypeError("preprocess settings were expected to be a function call");
		/** @type {import("estree").CallExpression} */
		const preprocessConfigValue = preprocessConfig.value;
		preprocessArray.elements.push(preprocessConfigValue);
		preprocessConfig.value = preprocessArray;
	}

	return preprocessConfig.value;
};

/**
 *
 * @param {object} param0
 * @param {import("estree").ArrayExpression} param0.preprocessArray
 * @param {string} param0.sveltePreprocessImportedAs
 * @returns {import("estree").ObjectExpression}
 */
export const getSveltePreprocessArgs = ({ preprocessArray, sveltePreprocessImportedAs }) => {
	/** @type {import("estree").CallExpression | undefined} */
	let sveltePreprocessFunctionCall;
	for (const element of preprocessArray.elements) {
		if (!element) continue;
		if (element.type !== "CallExpression") continue;
		if (element.callee.type !== "Identifier") continue;
		if (element.callee.name !== sveltePreprocessImportedAs) continue;
		sveltePreprocessFunctionCall = element;
	}

	// Add a svelte-preprocess() call to the config if missing
	if (!sveltePreprocessFunctionCall) {
		sveltePreprocessFunctionCall = {
			type: "CallExpression",
			// @ts-ignore - I am not sure why this is typed wrongly (?)
			arguments: [],
			callee: {
				type: "Identifier",
				name: sveltePreprocessImportedAs,
			},
			optional: false,
		};

		preprocessArray.elements.push(sveltePreprocessFunctionCall);
	}

	// Initialize the svelte-preprocess options as {} if none were passed
	if (sveltePreprocessFunctionCall.arguments.length === 0) {
		/** @type {import("estree").ObjectExpression} */
		const emptyObject = {
			type: "ObjectExpression",
			properties: [],
		};

		sveltePreprocessFunctionCall.arguments.push(emptyObject);
	}

	if (sveltePreprocessFunctionCall.arguments[0].type !== "ObjectExpression") throw new TypeError("that's an unexpected argument to svelte-preprocess");

	return sveltePreprocessFunctionCall.arguments[0];
};
