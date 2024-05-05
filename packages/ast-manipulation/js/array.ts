import { AstKinds, AstTypes } from "@svelte-add/ast-tooling";
import { areNodesEqual } from "./common";

export function createEmpty() {
    const arrayExpression: AstTypes.ArrayExpression = {
        type: "ArrayExpression",
        elements: [],
    };
    return arrayExpression;
}

export function push(ast: AstTypes.ArrayExpression, data: string | AstKinds.ExpressionKind) {
    if (typeof data === "string") {
        const existingLiterals = ast.elements.filter((x) => x?.type == "StringLiteral") as AstTypes.StringLiteral[];
        let literal = existingLiterals.find((x) => x.value == data);

        if (!literal) {
            literal = {
                type: "StringLiteral",
                value: data,
            };
            ast.elements.push(literal);
        }
    } else {
        let anyNodeEquals = false;
        const elements = ast.elements as AstTypes.ASTNode[];
        for (const node of elements) {
            if (areNodesEqual(data, node)) {
                anyNodeEquals = true;
            }
        }

        if (!anyNodeEquals) {
            ast.elements.push(data);
        }
    }
}
