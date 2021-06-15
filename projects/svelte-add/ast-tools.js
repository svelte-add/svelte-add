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
				const assignmentExpression = (node);

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
				const exportDefault = (node);
				
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
			}

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
					}
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
					}
				};

				typeScriptEstree.program.body.push(exportConfig);
			} else {
				if (!configObjectExpression) throw new Error("TODO: make this work");
				const exportConfig = {};
				typeScriptEstree.program.body.push(exportConfig);
			}
		}

		walk(typeScriptEstree, {
			enter(node) {
				if (node.type !== "VariableDeclarator") return;

				/** @type {import("estree").VariableDeclarator} */
				const variableDeclarator = (node);

				if (variableDeclarator.id.type === "Identifier" && variableDeclarator.id.name === configObjectVariable) {
					const init = (variableDeclarator.init);
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
