import { walk } from "estree-walker";

/**
 * @param {object} param0
 * @param {import("estree").ObjectExpression} param0.object
 * @param {string} param0.property
 * @returns {import("estree").Property | undefined}
 */
export const getProperty = ({ object, property: propertyName }) => {
	/** @type {import("estree").Property | undefined} */
	let matchingProperty;
	for (const property of object.properties) {
		if (property.type !== "Property") continue;
		if (property.key.type !== "Identifier") continue;
		if (property.key.name !== propertyName) continue;

		matchingProperty = property;
	}

	return matchingProperty;
};

/**
 * @param {object} param0
 * @param {import("estree").ObjectExpression} param0.object
 * @param {string} param0.property
 * @param {import("estree").Expression} param0.value
 * @returns {void}
 */
export const setPropertyValue = ({ object, property, value }) => {
	let matchingProperty = getProperty({ object, property });
	if (matchingProperty) {
		matchingProperty.value = value;
	} else {
		matchingProperty = {
			type: "Property",
			computed: false,
			key: {
				type: "Identifier",
				name: property,
			},
			kind: "init",
			method: false,
			shorthand: false,
			value,
		};

		object.properties.push(matchingProperty);
	}
};

/**
 * @template {import("estree").Expression} Default
 * @param {object} param0
 * @param {Default} param0.default
 * @param {import("estree").ObjectExpression} param0.object
 * @param {string} param0.property
 * @returns {import("estree").Expression}
 */
export const setDefault = ({ default: defaultValue, object, property }) => {
	const matchingProperty = getProperty({ object, property });

	if (matchingProperty && matchingProperty.value.type !== "ArrayPattern" && matchingProperty.value.type !== "AssignmentPattern" && matchingProperty.value.type !== "ObjectPattern" && matchingProperty.value.type !== "RestElement") {
		return matchingProperty.value;
	} else {
		setPropertyValue({ object, property, value: defaultValue });
	}
	return defaultValue;
};

/**
 * @param {object} param0
 * @param {boolean} param0.cjs
 * @param {import("estree").Expression} param0.defaultValue
 * @param {string} [param0.defaultVariableName]
 * @param {import("./ast-io.js").RecastAST} param0.typeScriptEstree
 * @returns {import("estree").Expression}
 */
export const setDefaultDefaultExport = ({ cjs, defaultValue, defaultVariableName = "config", typeScriptEstree }) => {
	/** @type {string | undefined} */
	let defaultExportVariable;

	/** @type {import("estree").Expression | undefined} */
	let defaultExportExpression;

	walk(typeScriptEstree, {
		enter(node) {
			if (cjs) {
				if (node.type !== "AssignmentExpression") return;
				const assignmentExpression = /** @type {import("estree").AssignmentExpression} */ (node);

				const assigningTo = assignmentExpression.left;
				if (assigningTo.type !== "MemberExpression") return;

				if (assigningTo.object.type !== "Identifier") return;
				if (assigningTo.object.name !== "module") return;

				if (assigningTo.property.type !== "Identifier") return;
				if (assigningTo.property.name !== "exports") return;

				const assignedTo = assignmentExpression.right;
				if (assignedTo.type === "Identifier") {
					defaultExportVariable = assignedTo.name;
				} else {
					defaultExportExpression = assignedTo;
				}
			} else {
				if (node.type !== "ExportDefaultDeclaration") return;

				const exportDefault = /** @type {import("estree").ExportDefaultDeclaration} */ (node);

				const exportDefaultDeclaration = exportDefault.declaration;

				if (exportDefaultDeclaration.type === "Identifier") {
					defaultExportVariable = exportDefaultDeclaration.name;
				} else {
					if (exportDefaultDeclaration.type === "FunctionDeclaration") throw new Error("?!?! default export is a FunctionDeclaration");
					if (exportDefaultDeclaration.type === "ClassDeclaration") throw new Error("?!?! default export is a ClassDeclaration");
					defaultExportExpression = exportDefaultDeclaration;
				}
			}
		},
	});

	if (!defaultExportExpression) {
		if (!defaultExportVariable) {
			defaultExportExpression = defaultValue;

			defaultExportVariable = defaultVariableName;

			/** @type {import("estree").VariableDeclaration} */
			const declareConfig = {
				type: "VariableDeclaration",
				declarations: [
					{
						type: "VariableDeclarator",
						id: {
							type: "Identifier",
							name: defaultExportVariable,
						},
						init: defaultExportExpression,
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
							name: defaultExportVariable,
						},
					},
				};

				typeScriptEstree.program.body.push(exportConfig);
			} else {
				/** @type {import("estree").ExportDefaultDeclaration} */
				const exportConfig = {
					type: "ExportDefaultDeclaration",
					declaration: {
						type: "Identifier",
						name: defaultExportVariable,
					},
				};
				typeScriptEstree.program.body.push(exportConfig);
			}
		}

		walk(typeScriptEstree, {
			enter(node) {
				if (node.type !== "VariableDeclarator") return;

				const variableDeclarator = /** @type {import("estree").VariableDeclarator} */ (node);

				if (variableDeclarator.id.type === "Identifier" && variableDeclarator.id.name === defaultExportVariable) {
					const init = variableDeclarator.init;
					if (!init) return;
					defaultExportExpression = init;
				}
			},
		});
	}

	if (!defaultExportExpression) throw new Error(`TODO: make this work`);

	return defaultExportExpression;
};

/**
 * @param {object} param0
 * @param {boolean} param0.cjs
 * @param {string} param0.package
 * @param {import("./ast-io.js").RecastAST} param0.typeScriptEstree
 * @returns {{ default: string | undefined, named: Record<string, string>, require: string | undefined }}
 */
export const findImport = ({ cjs, package: pkg, typeScriptEstree }) => {
	/** @type {string | undefined} */
	let defaultImportedAs;
	/** @type {string | undefined} */
	let requiredAs;
	/** @type {Record<string, string>} */
	const named = {};

	walk(typeScriptEstree, {
		enter(node) {
			if (cjs) {
				if (node.type !== "VariableDeclarator") return;

				const declarator = /** @type {import("estree").VariableDeclarator} */ (node);

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

				requiredAs = identifier.name;
			} else {
				if (node.type !== "ImportDeclaration") return;

				const importDeclaration = /** @type {import("estree").ImportDeclaration} */ (node);

				if (importDeclaration.source.value !== pkg) return;

				for (const specifier of importDeclaration.specifiers) {
					if (specifier.type === "ImportDefaultSpecifier") defaultImportedAs = specifier.local.name;
					if (specifier.type === "ImportSpecifier") named[specifier.imported.name] = specifier.local.name;
				}
			}
		},
	});

	return {
		default: defaultImportedAs,
		named,
		require: requiredAs,
	};
};

/**
 * @param {object} param0
 * @param {boolean} param0.cjs
 * @param {string} [param0.default]
 * @param {Record<string, string>} [param0.named]
 * @param {string} param0.package
 * @param {string} [param0.require]
 * @param {import("./ast-io.js").RecastAST} param0.typeScriptEstree
 * @returns {void}
 */
export const addImport = ({ cjs, default: default_, named, package: pkg, require, typeScriptEstree }) => {
	if (cjs) {
		let id = /** @type {import("estree").VariableDeclarator["id"]} */ ({});

		if (require)
			id = {
				type: "Identifier",
				name: require,
			};

		if (named) {
			id = {
				type: "ObjectPattern",
				properties: Object.entries(named).map(([exportedAs, importAs]) => ({
					type: "Property",
					computed: false,
					key: {
						type: "Identifier",
						name: exportedAs,
					},
					kind: "init",
					method: false,
					shorthand: exportedAs === importAs,
					value: {
						type: "Identifier",
						name: importAs,
					},
				})),
			};
		}

		/** @type {import("estree").VariableDeclaration} */
		const requirePackageAst = {
			type: "VariableDeclaration",
			declarations: [
				{
					type: "VariableDeclarator",
					id,
					init: {
						type: "CallExpression",
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
		/** @type {import("estree").ImportDeclaration["specifiers"]} */
		const specifiers = [];

		if (default_)
			specifiers.push({
				type: "ImportDefaultSpecifier",
				local: {
					type: "Identifier",
					name: default_,
				},
			});

		for (const [exportedAs, importAs] of Object.entries(named ?? {})) {
			specifiers.push({
				type: "ImportSpecifier",
				imported: {
					type: "Identifier",
					name: exportedAs,
				},
				local: {
					type: "Identifier",
					name: importAs,
				},
			});
		}

		/** @type {import("estree").ImportDeclaration} */
		const importPackageAst = {
			type: "ImportDeclaration",
			source: {
				type: "Literal",
				value: pkg,
			},
			specifiers,
		};

		typeScriptEstree.program.body.unshift(importPackageAst);
	}
};

/**
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
		if (preprocessConfig.value.type !== "CallExpression") throw new TypeError("preprocess settings were expected to be a function call");
		// Convert preprocess config from a single function call to an array e.x. [vitePreprocess()]
		/** @type {import("estree").ArrayExpression} */
		const preprocessArray = {
			type: "ArrayExpression",
			elements: [preprocessConfig.value],
		};
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

	// Add a vitePreprocess() call to the config if missing
	if (!sveltePreprocessFunctionCall) {
		sveltePreprocessFunctionCall = {
			type: "CallExpression",
			arguments: [],
			callee: {
				type: "Identifier",
				name: sveltePreprocessImportedAs,
			},
			optional: false,
		};

		preprocessArray.elements.push(sveltePreprocessFunctionCall);
	}

	// Initialize the vitePreprocess options as {} if none were passed
	if (sveltePreprocessFunctionCall.arguments.length === 0) {
		/** @type {import("estree").ObjectExpression} */
		const emptyObject = {
			type: "ObjectExpression",
			properties: [],
		};

		sveltePreprocessFunctionCall.arguments.push(emptyObject);
	}

	if (sveltePreprocessFunctionCall.arguments[0].type !== "ObjectExpression") throw new TypeError("that's an unexpected argument to vitePreprocess");

	return sveltePreprocessFunctionCall.arguments[0];
};

/**
 * @param {object} param0
 * @param {import("./ast-io.js").RecastAST} param0.typeScriptEstree
 * @param {string} param0.value
 */
export const addRootBlockComment = ({ typeScriptEstree, value }) => {
	const blockComment = {
		type: "Block",
		value: value,
		leading: true,
		trailing: false,
	};

	// Note: as we are mixing RecastAST types with estree types it is nearly impossible
	// to find or create a type that would allow for all necessary properties.
	// For the sake of simplicity, let's assume the type `any` for the few lines below

	/** @type {any[]} */
	const body = typeScriptEstree.program.body;
	const firstNode = body[0];

	firstNode.comments = firstNode.comments ?? [];
	firstNode.comments.push(blockComment);
};
