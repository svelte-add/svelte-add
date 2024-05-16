import { AstKinds, AstTypes } from "@svelte-add/ast-tooling";

export function declaration(ast: AstTypes.Program, kind: "const" | "let" | "var", name: string, value: AstKinds.ExpressionKind) {
    const declarations = ast.body.filter((x): x is AstTypes.VariableDeclaration => x.type == "VariableDeclaration");
    let declaration = declarations.find((x) => {
        const declarator = x.declarations[0] as AstTypes.VariableDeclarator;
        const identifier = declarator.id as AstTypes.Identifier;
        return identifier.name == name;
    });

    if (declaration) return declaration;

    declaration = {
        type: "VariableDeclaration",
        kind,
        declarations: [
            {
                type: "VariableDeclarator",
                id: {
                    type: "Identifier",
                    name,
                },
                init: value,
            },
        ],
    };

    return declaration;
}

export function identifier(name: string) {
    const identifier: AstTypes.Identifier = {
        type: "Identifier",
        name,
    };
    return identifier;
}
