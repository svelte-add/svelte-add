import { AstKinds, AstTypes } from "@svelte-add/ast-tooling";

export type ExportDefaultReturn<T> = {
    astNode: AstTypes.ExportDefaultDeclaration;
    value: T;
};

export function defaultExport<T extends AstKinds.ExpressionKind>(
    ast: AstTypes.Program,
    fallbackDeclaration: T,
): ExportDefaultReturn<T> {
    const existingNode = ast.body.find((x) => x.type == "ExportDefaultDeclaration");
    if (!existingNode) {
        const node: AstTypes.ExportDefaultDeclaration = {
            type: "ExportDefaultDeclaration",
            declaration: fallbackDeclaration,
        };

        ast.body.push(node);
        return { astNode: node, value: fallbackDeclaration };
    }

    const exportDefaultDeclaration = existingNode as AstTypes.ExportDefaultDeclaration;

    if (exportDefaultDeclaration.declaration.type == "Identifier") {
        // in this case the export default declaration is only referencing a variable, get that variable
        const exportDefaultDeclarationDeclaration = exportDefaultDeclaration.declaration as AstTypes.Identifier;

        const variableDeclarations = ast.body.filter((x): x is AstTypes.VariableDeclaration => x.type == "VariableDeclaration");
        const variableDeclaration = variableDeclarations.find((x) => {
            const variableDeclaration = x.declarations[0] as AstTypes.VariableDeclarator;
            const variableIdentifier = variableDeclaration.id as AstTypes.Identifier;

            return variableIdentifier.name == exportDefaultDeclarationDeclaration.name;
        });
        if (!variableDeclaration)
            throw new Error(`Unable to find exported variable '${exportDefaultDeclarationDeclaration.name}'`);

        const variableDeclarator = variableDeclaration.declarations[0] as AstTypes.VariableDeclarator;

        const value = variableDeclarator.init as T;

        return { astNode: exportDefaultDeclaration, value };
    }

    const declaration = exportDefaultDeclaration.declaration as T;
    return { astNode: exportDefaultDeclaration, value: declaration };
}

export function namedExport(ast: AstTypes.Program, name: string, fallback: AstTypes.VariableDeclaration) {
    const namedExports = ast.body.filter((x): x is AstTypes.ExportNamedDeclaration => x.type == "ExportNamedDeclaration");
    let namedExport = namedExports.find((x) => {
        const variableDeclaration = x.declaration as AstTypes.VariableDeclaration;
        const variableDeclarator = variableDeclaration.declarations[0] as AstTypes.VariableDeclarator;
        const identifier = variableDeclarator.id as AstTypes.Identifier;
        return identifier.name == name;
    });

    if (namedExport) return namedExport;

    namedExport = {
        type: "ExportNamedDeclaration",
        declaration: fallback,
    };
    ast.body.push(namedExport);
}
