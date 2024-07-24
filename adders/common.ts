import type { ScriptFileEditorArgs } from "@svelte-add/core";

export function addEslintConfigPrettier({ ast, imports, exports, common }: ScriptFileEditorArgs<{}>) {
    // TODO: maybe this could be more intelligent and we can detect the name of the default import?
    imports.addDefault(ast, "eslint-plugin-svelte", "svelte");
    imports.addDefault(ast, "eslint-config-prettier", "prettier");

    const fallbackConfig = common.expressionFromString("[]");
    const defaultExport = exports.defaultExport(ast, fallbackConfig);
    const array = defaultExport.value;
    if (array.type !== "ArrayExpression") return;

    const prettier = common.expressionFromString("prettier");
    const sveltePrettierConfig = common.expressionFromString("svelte.configs['flat/prettier']");
    const configSpread = common.createSpreadElement(sveltePrettierConfig);

    const nodesToInsert = [];
    if (!common.hasNode(array, prettier)) nodesToInsert.push(prettier);
    if (!common.hasNode(array, configSpread)) nodesToInsert.push(configSpread);

    // finds index of `...svelte.configs["..."]`
    const idx = array.elements.findIndex(
        (el) =>
            el?.type === "SpreadElement" &&
            el.argument.type === "MemberExpression" &&
            el.argument.object.type === "MemberExpression" &&
            el.argument.object.property.type === "Identifier" &&
            el.argument.object.property.name === "configs" &&
            el.argument.object.object.type === "Identifier" &&
            el.argument.object.object.name === "svelte",
    );

    if (idx !== -1) {
        array.elements.splice(idx + 1, 0, ...nodesToInsert);
    } else {
        // append to the end as a fallback
        array.elements.push(...nodesToInsert);
    }
}
