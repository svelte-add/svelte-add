import { type AstKinds, type AstTypes, Walker, parseScript, serializeScript, stripAst } from "@svelte-add/ast-tooling";
import decircular from "decircular";
import dedent from "dedent";

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

export function createSpreadElement(expression: AstKinds.ExpressionKind): AstTypes.SpreadElement {
    return {
        type: "SpreadElement",
        argument: expression,
    };
}

export function createLiteral(value: string | null = null) {
    const literal: AstTypes.Literal = {
        type: "Literal",
        value,
    };

    return literal;
}

export function areNodesEqual(ast1: AstTypes.ASTNode, ast2: AstTypes.ASTNode) {
    // We're deep cloning these trees so that we can strip the locations off of them for comparisons.
    // Without this, we'd be getting false negatives due to slight differences in formatting style.
    // These ASTs are also filled to the brim with circular references, which prevents
    // us from using `structuredCloned` directly
    const ast1Clone = decircular(ast1);
    const ast2Clone = decircular(ast2);
    return serializeScript(stripAst(ast1Clone, "loc")) === serializeScript(stripAst(ast2Clone, "loc"));
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
    const program = parseScript(dedent(value));

    for (const childNode of program.body) {
        ast.body.push(childNode);
    }
}

export function expressionFromString(value: string): AstKinds.ExpressionKind {
    const program = parseScript(dedent(value));
    const statement = program.body[0];
    if (statement.type !== "ExpressionStatement") {
        throw new Error("value passed was not an expression");
    }

    return statement.expression;
}

export function statementFromString(value: string): AstKinds.StatementKind {
    const program = parseScript(dedent(value));
    const statement = program.body[0];

    return statement;
}

/** Appends the statement to body of the block if it doesn't already exist */
export function addStatement(ast: AstTypes.BlockStatement | AstTypes.Program, statement: AstKinds.StatementKind) {
    if (!hasNode(ast, statement)) ast.body.push(statement);
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
