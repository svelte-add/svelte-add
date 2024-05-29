import { AstKinds, AstTypes, parseScript, serializeScript } from "@svelte-add/ast-tooling";

export function addJsDocTypeComment(node: AstTypes.Node, type: string) {
    const comment: AstTypes.CommentBlock = {
        type: "CommentBlock",
        value: `* @type {${type}} `,
    };

    if (!node.comments) node.comments = [];

    node.comments.push(comment);
}

export function typeAnnotateExpression(node: AstKinds.ExpressionKind, type: string) {
    const expression: AstTypes.TSAsExpression = {
        type: "TSAsExpression",
        expression: node,
        typeAnnotation: { type: "TSTypeReference", typeName: { type: "Identifier", name: type } },
    };

    return expression;
}

export function createLiteral(value: string | null = null) {
    const literal: AstTypes.Literal = {
        type: "Literal",
        value,
    };

    return literal;
}

export function areNodesEqual(ast1: AstTypes.ASTNode, ast2: AstTypes.ASTNode) {
    return serializeScript(ast1) == serializeScript(ast2);
}

export function blockStatement() {
    const statement: AstTypes.BlockStatement = {
        type: "BlockStatement",
        body: [],
    };
    return statement;
}

export function expressionStatement(expression: AstKinds.ExpressionKind) {
    const statement: AstTypes.ExpressionStatement = {
        type: "ExpressionStatement",
        expression,
    };
    return statement;
}

export function addFromString(ast: AstTypes.BlockStatement | AstTypes.Program, value: string) {
    const program = parseScript(value);

    for (const childNode of program.body) {
        ast.body.push(childNode);
    }
}

export function expressionFromString(value: string): AstKinds.ExpressionKind {
    const program = parseScript(value);

    return program.body[0] as unknown as AstKinds.ExpressionKind;
}
