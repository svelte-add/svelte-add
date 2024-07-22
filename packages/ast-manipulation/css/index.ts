import { Declaration, Rule, AtRule, Comment, type CssAst } from "@svelte-add/ast-tooling";

export type CssAstEditor = {
    ast: CssAst;
    addRule: typeof addRule;
    addDeclaration: typeof addDeclaration;
    addAtRule: typeof addAtRule;
    addComment: typeof addComment;
    Declaration: typeof Declaration;
    AtRule: typeof AtRule;
    Rule: typeof Rule;
    Comment: typeof Comment;
};

export function getCssAstEditor(ast: CssAst) {
    const editor: CssAstEditor = {
        ast,
        addRule,
        addAtRule,
        addDeclaration,
        addComment,
        Declaration,
        AtRule,
        Rule,
        Comment,
    };

    return editor;
}

export function addRule(ast: CssAst, selector: string): Rule {
    const rules = ast.nodes.filter((x): x is Rule => x.type == "rule");
    let rule = rules.find((x) => x.selector == selector);

    if (!rule) {
        rule = new Rule();
        rule.selector = selector;
        ast.nodes.push(rule);
    }

    return rule;
}

export function addDeclaration(ast: Rule | CssAst, property: string, value: string) {
    const declarations = ast.nodes.filter((x): x is Declaration => x.type == "decl");
    let declaration = declarations.find((x) => x.prop == property);

    if (!declaration) {
        declaration = new Declaration({ prop: property, value: value });
        ast.append(declaration);
    } else {
        declaration.value = value;
    }
}

export function addAtRule(ast: CssAst, name: string, params: string, append = false): AtRule {
    const atRules = ast.nodes.filter((x): x is AtRule => x.type == "atrule");
    let atRule = atRules.find((x) => x.name == name && x.params == params);

    if (atRule) {
        return atRule;
    }

    atRule = new AtRule({ name, params });
    if (!append) {
        ast.prepend(atRule);
    } else {
        ast.append(atRule);
    }

    return atRule;
}

export function addComment(ast: CssAst, commentValue: string) {
    const comment = new Comment({ text: commentValue });
    ast.append(comment);
}
