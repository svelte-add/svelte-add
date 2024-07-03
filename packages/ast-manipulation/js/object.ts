import type { AstKinds, AstTypes } from "@svelte-add/ast-tooling";

export function property<T extends AstKinds.ExpressionKind | AstTypes.Identifier>(
    ast: AstTypes.ObjectExpression,
    name: string,
    fallback: T,
): T {
    const objectExpression = ast;
    const properties = objectExpression.properties.filter((x): x is AstTypes.ObjectProperty => x.type == "ObjectProperty");
    let property = properties.find((x) => (x.key as AstTypes.Identifier).name == name);
    let propertyValue: T;

    if (property) {
        propertyValue = property.value as T;
    } else {
        let isShorthand = false;
        if (fallback.type == "Identifier") {
            const identifier: AstTypes.Identifier = fallback;
            isShorthand = identifier.name == name;
        }

        propertyValue = fallback;
        property = {
            type: "ObjectProperty",
            shorthand: isShorthand,
            key: {
                type: "Identifier",
                name: name,
            },
            value: propertyValue,
        };

        objectExpression.properties.push(property);
    }

    return propertyValue;
}

export function overrideProperty<T extends AstKinds.ExpressionKind>(ast: AstTypes.ObjectExpression, name: string, value: T) {
    const objectExpression = ast;
    const properties = objectExpression.properties.filter((x): x is AstTypes.ObjectProperty => x.type == "ObjectProperty");
    const prop = properties.find((x) => (x.key as AstTypes.Identifier).name == name);

    if (!prop) {
        return property(ast, name, value);
    }

    prop.value = value;

    return value;
}

export function overrideProperties<T extends AstKinds.ExpressionKind>(
    ast: AstTypes.ObjectExpression,
    obj: Record<string, T | undefined>,
) {
    for (const [prop, value] of Object.entries(obj)) {
        if (value === undefined) continue;
        overrideProperty(ast, prop, value);
    }
}

export function properties<T extends AstKinds.ExpressionKind>(
    ast: AstTypes.ObjectExpression,
    obj: Record<string, T | undefined>,
) {
    for (const [prop, value] of Object.entries(obj)) {
        if (value === undefined) continue;
        property(ast, prop, value);
    }
}

export function removeProperty(ast: AstTypes.ObjectExpression, property: string) {
    const properties = ast.properties.filter((x): x is AstTypes.ObjectProperty => x.type === "ObjectProperty");
    const propIdx = properties.findIndex((x) => (x.key as AstTypes.Identifier).name === property);

    if (propIdx !== -1) {
        ast.properties.splice(propIdx, 1);
    }
}

export function create<T extends AstKinds.ExpressionKind>(obj: Record<string, T | undefined>): AstTypes.ObjectExpression {
    const objExpression = createEmpty();

    for (const [prop, value] of Object.entries(obj)) {
        if (value === undefined) continue;
        property(objExpression, prop, value);
    }

    return objExpression;
}

export function createEmpty() {
    const objectExpression: AstTypes.ObjectExpression = {
        type: "ObjectExpression",
        properties: [],
    };
    return objectExpression;
}

export type ExportDefaultReturn<T> = {
    astNode: AstTypes.ExportDefaultDeclaration;
    value: T;
};
