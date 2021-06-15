import { walk } from "estree-walker";
import { AtRule } from "postcss";
import { newTypeScriptEstreeAst } from "../../ast-io.js";
import { getConfigObject } from "../../ast-tools.js";
import { globalStylesheetPostcssPath, postcssConfigCjsPath } from "../postcss/stuff.js";
import { tailwindConfigCjsPath } from "./stuff.js";

const tailwindAotConfig = `const { tailwindExtractor } = require("tailwindcss/lib/lib/purgeUnusedStyles");

const config = {
	mode: "aot",
	purge: {
		content: [
			"./src/**/*.{html,js,svelte,ts}",
		],
		options: {
			defaultExtractor: (content) => [
				// If this stops working, please open an issue at https://github.com/svelte-add/tailwindcss/issues rather than bothering Tailwind Labs about it
				...tailwindExtractor(content),
				// Match Svelte class: directives (https://github.com/tailwindlabs/tailwindcss/discussions/1731)
				...[...content.matchAll(/(?:class:)*([\\w\\d-/:%.]+)/gm)].map(([_match, group, ..._rest]) => group),
			],
		},
		safelist: [/^svelte-[\\d\\w]+$/],
	},
	theme: {
		extend: {},
	},
	variants: {
		extend: {},
	},
	plugins: [],
};

module.exports = config;
`;

const tailwindJitConfig = `const config = {
	mode: "jit",
	purge: [
		"./src/**/*.{html,js,svelte,ts}",
	],
	theme: {
		extend: {},
	},
	plugins: [],
};

module.exports = config;
`;

/**
 * @param {import("../../ast-io.js").RecastAST} postcssConfigAst 
 */
const updatePostcssConfig = (postcssConfigAst) => {
	const configObject = getConfigObject({
		cjs: true,
		typeScriptEstree: postcssConfigAst,
	});

	// Try to find plugins config
	/** @type {import("estree").Property | undefined} */
	let pluginsConfig;
	for (const property of configObject.properties) {
		if (property.type !== "Property") continue;
		if (property.key.type !== "Identifier") continue;
		if (property.key.name !== "plugins") continue;
		
		pluginsConfig = property;
	}

	// Or set it to [] if it doesn't exist
	if (!pluginsConfig) {
		pluginsConfig = {
			type: "Property",
			computed: false,
			key: {
				type: "Identifier",
				name: "plugins",
			},
			kind: "init",
			method: false,
			shorthand: false,
			value: {
				type: "ArrayExpression",
				elements: [],
			}
		}
		configObject.properties.push(pluginsConfig);
	}

	if (pluginsConfig.value.type !== "ArrayExpression") throw new Error("`plugins` in PostCSS config needs to be an array");
	const pluginsList = pluginsConfig.value.elements;

	const goAfter = ["postcss-nested"];
	let minIndex = 0;

	const goBefore = ["autoprefixer", "cssnano"];
	let maxIndex = pluginsConfig.value.elements.length;

	/** @type {string | undefined} */
	let tailwindcssImportedAs;

	/** @type {Record<string, string>} Identifier name -> imported package */
	const imports = {};
	walk(postcssConfigAst, {
		enter(node) {
			if (node.type !== "VariableDeclarator") return;

			/** @type {import("estree").VariableDeclarator} */
			const declarator = (node);
			
			if (declarator.id.type !== "Identifier") return;
			const identifier = declarator.id;
			
			if (!declarator.init) return;
			if (declarator.init.type !== "CallExpression") return;
			const callExpression = declarator.init;

			if (callExpression.callee.type !== "Identifier") return;
			/** @type {import("estree").Identifier} */
			const callee = (callExpression.callee);

			if (callee.name !== "require") return;

			if (callExpression.arguments[0].type !== "Literal") return;
			const requireArgValue = callExpression.arguments[0].value;

			if (typeof requireArgValue !== "string") return;
			imports[identifier.name] = requireArgValue;

			if (requireArgValue === "tailwindcss") tailwindcssImportedAs = identifier.name;
		}
	})


	// Add a tailwindcss import if it's not there
	if (!tailwindcssImportedAs) {
		tailwindcssImportedAs = "tailwindcss";
		
		/** @type {import("estree").VariableDeclaration} */
		const requireTailwindcssAst = {
			type: "VariableDeclaration",
			declarations: [
				{
					type: "VariableDeclarator",
					id: {
						type: "Identifier",
						name: tailwindcssImportedAs,
					},
					init: {
						type: "CallExpression",
						// @ts-ignore - I am not sure why this is typed wrongly (?)
						arguments: [
							{
								type: "Literal",
								value: "tailwindcss",
							},
						],
						callee: {
							type: "Identifier",
							name: "require",
						},
						optional: false,
					},
				}
			],
			kind: "const",
		};

		postcssConfigAst.program.body.unshift(requireTailwindcssAst);
	}


	for (const [index, plugin] of pluginsList.entries()) {
		if (!plugin) continue;

		/** @type {string | undefined} */
		let determinedPlugin;

		if (plugin.type === "CallExpression") {
			if (plugin.callee.type === "Identifier") {
				determinedPlugin = imports[plugin.callee.name];
			}
		} else if (plugin.type === "Identifier") {
			determinedPlugin = imports[plugin.name];
		}
		// TODO: detect conditional plugins (e.x. !dev && cssnano())

		if (!determinedPlugin) continue;

		if (goAfter.includes(determinedPlugin)) {
			if (index > minIndex) minIndex = index;
		} else if (goBefore.includes(determinedPlugin)) {
			if (index < maxIndex) maxIndex = index;
		}
	}

	if (minIndex > maxIndex) throw new Error("cannot find place to slot `tailwindcss()` as a plugin in the PostCSS config");


	// We have a range of acceptable values
	// Let's use the latest slot because it's probably the most likely to work correctly
	pluginsList.splice(maxIndex, 0, {
		// @ts-expect-error - Force accept the comment - TODO: find a better way to handle this
		type: "Line",
		// @ts-expect-error - Force accept the comment
		value: `Some plugins, like ${goAfter[0]}, need to run before Tailwind`,
	});

	pluginsList.splice(maxIndex + 1, 0, /** @type {import("estree").CallExpression} */ {
		type: "CallExpression",
		// @ts-ignore - I am not sure why this is typed wrongly (?)
		arguments: [],
		callee: {
			type: "Identifier",
			name: tailwindcssImportedAs,
		},
		optional: false,
	});

	pluginsList.splice(maxIndex + 2, 0, {
		// @ts-expect-error - Force accept the comment
		type: "Line",
		// @ts-expect-error - Force accept the comment
		value: `But others, like ${goBefore[0]}, need to run after`,
	});


	return postcssConfigAst;
}

/**
 * 
 * @param {import("../../ast-io.js").PostCSSAst} postcss
 * @returns {import("../../ast-io.js").PostCSSAst}
 */
const updateGlobalStylesheet = (postcss) => {
	const base = new AtRule({
		name: "tailwind",
		params: "base",
	});

	const components = new AtRule({
		name: "tailwind",
		params: "components",
	});

	const utilities = new AtRule({
		name: "tailwind",
		params: "utilities",
	});

	postcss.append(components);
	postcss.append(utilities);

	const imports = postcss.nodes.filter((node) => node.type === "atrule" && node.name === "import");
	const lastImport = imports[imports.length - 1];

	if (lastImport) {
		lastImport.after(base);
	} else {
		const [stylesHintComment] = postcss.nodes.filter((node) => node.type === "comment" && node.text === globalStylesheetPostcssPath);

		if (stylesHintComment) {
			stylesHintComment.after(base);
		} else {
			postcss.prepend(base);
		}
	}

	return postcss;
}

/** @type {import("../..").AdderRun<{ jit: boolean }>} */
export const run = async ({ install, options, updateCss, updateJavaScript }) => {
	await updateJavaScript({
		path: tailwindConfigCjsPath,
		async script() {
			return {
				typeScriptEstree: newTypeScriptEstreeAst(options.jit ? tailwindJitConfig : tailwindAotConfig),
			}
		}
	});

	await updateJavaScript({
		path: postcssConfigCjsPath,
		async script({ typeScriptEstree }) {
			return {
				typeScriptEstree: updatePostcssConfig(typeScriptEstree),
			}
		}
	});

	await updateCss({
		path: globalStylesheetPostcssPath,
		async style({ postcss }) {
			return {
				postcss: updateGlobalStylesheet(postcss),
			}
		}
	});

	await install({ package: "tailwindcss" });
};
