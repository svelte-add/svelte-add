import { AstTypes } from "@svelte-add/ast-tooling";
import { areNodesEqual } from "./common.js";

export function addEmpty(ast: AstTypes.Program, importFrom: string) {
    const expectedImportDeclaration: AstTypes.ImportDeclaration = {
        type: "ImportDeclaration",
        source: {
            type: "Literal",
            value: importFrom,
        },
        specifiers: [],
    };

    addImportIfNecessary(ast, expectedImportDeclaration);
}

export function addDefault(ast: AstTypes.Program, importFrom: string, importAs: string) {
    const expectedImportDeclaration: AstTypes.ImportDeclaration = {
        type: "ImportDeclaration",
        source: {
            type: "Literal",
            value: importFrom,
        },
        specifiers: [
            {
                type: "ImportDefaultSpecifier",
                local: {
                    type: "Identifier",
                    name: importAs,
                },
            },
        ],
    };

    addImportIfNecessary(ast, expectedImportDeclaration);
}

export function addNamed(ast: AstTypes.Program, importFrom: string, exportedAsImportAs: Record<string, string>) {
    const specifiers = Object.entries(exportedAsImportAs).map(([key, value]) => {
        const specifier: AstTypes.ImportSpecifier = {
            type: "ImportSpecifier",
            imported: {
                type: "Identifier",
                name: key,
            },
            local: {
                type: "Identifier",
                name: value,
            },
        };
        return specifier;
    });

    const expectedImportDeclaration: AstTypes.ImportDeclaration = {
        type: "ImportDeclaration",
        source: {
            type: "Literal",
            value: importFrom,
        },
        specifiers,
    };

    addImportIfNecessary(ast, expectedImportDeclaration);
}

function addImportIfNecessary(ast: AstTypes.Program, expectedImportDeclaration: AstTypes.ImportDeclaration) {
    const importDeclarations = ast.body.filter((x) => x.type == "ImportDeclaration");
    const importDeclaration = importDeclarations.find((x) => areNodesEqual(x, expectedImportDeclaration));

    if (!importDeclaration) {
        ast.body.unshift(expectedImportDeclaration);
    }
}
