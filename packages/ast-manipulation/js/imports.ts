import { Walker, type AstTypes } from '@svelte-add/ast-tooling';
import { areNodesEqual } from './common.js';

export function addEmpty(ast: AstTypes.Program, importFrom: string) {
	const expectedImportDeclaration: AstTypes.ImportDeclaration = {
		type: 'ImportDeclaration',
		source: {
			type: 'Literal',
			value: importFrom,
		},
		specifiers: [],
	};

	addImportIfNecessary(ast, expectedImportDeclaration);
}

export function addDefault(ast: AstTypes.Program, importFrom: string, importAs: string) {
	const expectedImportDeclaration: AstTypes.ImportDeclaration = {
		type: 'ImportDeclaration',
		source: {
			type: 'Literal',
			value: importFrom,
		},
		specifiers: [
			{
				type: 'ImportDefaultSpecifier',
				local: {
					type: 'Identifier',
					name: importAs,
				},
			},
		],
	};

	addImportIfNecessary(ast, expectedImportDeclaration);
}

export function addNamed(
	ast: AstTypes.Program,
	importFrom: string,
	exportedAsImportAs: Record<string, string>,
	isType = false,
) {
	const specifiers = Object.entries(exportedAsImportAs).map(([key, value]) => {
		const specifier: AstTypes.ImportSpecifier = {
			type: 'ImportSpecifier',
			imported: {
				type: 'Identifier',
				name: key,
			},
			local: {
				type: 'Identifier',
				name: value,
			},
		};
		return specifier;
	});

	let declaration: AstTypes.ImportDeclaration | undefined;
	// prettier-ignore
	Walker.walk(ast as AstTypes.ASTNode, {}, {
		ImportDeclaration(node) {
			if (node.source.type === 'StringLiteral' && node.source.value === importFrom) {
				declaration = node;
			}
		},
	});

	// merge the specifiers into a single import declaration if they share a source
	if (declaration) {
		specifiers.forEach((s) => {
			if (
				declaration?.specifiers?.every(
					(sp) =>
						sp.type === 'ImportSpecifier' &&
						sp.local?.name !== s.local?.name &&
						sp.imported.name !== s.imported.name,
				)
			) {
				declaration?.specifiers?.push(s);
			}
		});
		return;
	}

	const expectedImportDeclaration: AstTypes.ImportDeclaration = {
		type: 'ImportDeclaration',
		source: {
			type: 'Literal',
			value: importFrom,
		},
		specifiers,
		importKind: isType ? 'type' : undefined,
	};

	ast.body.unshift(expectedImportDeclaration);
}

function addImportIfNecessary(
	ast: AstTypes.Program,
	expectedImportDeclaration: AstTypes.ImportDeclaration,
) {
	const importDeclarations = ast.body.filter((x) => x.type == 'ImportDeclaration');
	const importDeclaration = importDeclarations.find((x) =>
		areNodesEqual(x, expectedImportDeclaration),
	);

	if (!importDeclaration) {
		ast.body.unshift(expectedImportDeclaration);
	}
}
