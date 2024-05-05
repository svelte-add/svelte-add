import { AstKinds, AstTypes } from "@svelte-add/ast-tooling";

export function property<T extends AstKinds.ExpressionKind | AstTypes.Identifier>(
    ast: AstTypes.ObjectExpression,
    name: string,
    fallback: T,
): T {
    const objectExpression = ast;
    const properties =
        (objectExpression.properties?.filter((x) => x.type == "ObjectProperty") as AstTypes.ObjectProperty[]) ?? [];
    let property = properties.find((x) => (x.key as AstTypes.Identifier).name == name);
    let propertyValue: T;

    if (property) {
        propertyValue = property.value as T;
    } else {
        let isShorthand = false;
        if (fallback.type == "Identifier") {
            const identifier = fallback as AstTypes.Identifier;
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

        if (!objectExpression.properties) objectExpression.properties = [];
        objectExpression.properties.push(property);
    }

    return propertyValue;
}

export function overrideProperty<T extends AstKinds.ExpressionKind>(ast: AstTypes.ObjectExpression, name: string, value: T) {
    const objectExpression = ast;
    const properties = objectExpression.properties.filter((x) => x.type == "ObjectProperty") as AstTypes.ObjectProperty[];
    const property = properties.find((x) => (x.key as AstTypes.Identifier).name == name);

    if (!property) {
        throw new Error(`cannot override non existent property '${name}'`);
    }

    property.value = value;

    return value;
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
