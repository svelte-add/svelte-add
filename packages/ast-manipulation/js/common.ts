import { AstKinds, AstTypes, Walker, parseScript, serializeScript } from "@svelte-add/ast-tooling";

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
    return serializeScript(ast1) === serializeScript(ast2);
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
    const statement = program.body[0];
    if (statement.type !== "ExpressionStatement") {
        throw new Error("value passed was not an expression");
    }

    return statement.expression;
}

export function statementFromString(value: string): AstKinds.StatementKind {
    const program = parseScript(value);

    return program.body[0];
}

/** Appends the statement to body of the block */
export function addStatement(ast: AstTypes.BlockStatement | AstTypes.Program, statement: AstKinds.StatementKind) {
    if (hasNode(ast, statement) === false) ast.body.push(statement);
}

/** Returns `true` of the provided node exists in the AST */
export function hasNode(ast: AstTypes.ASTNode, nodeToMatch: AstTypes.ASTNode): boolean {
    let found = false;
    // prettier-ignore
    // this gets needlessly butchered by prettier
    Walker.walk(ast, {}, {
        _(node, { next, stop }) {
            if (node.type === nodeToMatch.type) {
                found = areNodesEqual(node, nodeToMatch);
                if (found) stop();
            }
            next();
        },
    });
    return found;
}
