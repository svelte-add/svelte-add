import * as ArrayUtils from "./array.js";
import * as ObjectUtils from "./object.js";
import * as CommonUtils from "./common.js";
import * as FunctionUtils from "./function.js";
import * as ImportUtils from "./imports.js";
import * as VariableUtils from "./variables.js";
import * as ExportUtils from "./exports.js";
import type { AstTypes } from "@svelte-add/ast-tooling";

export type JsAstEditor = {
    ast: AstTypes.Program;
    common: typeof CommonUtils;
    array: typeof ArrayUtils;
    object: typeof ObjectUtils;
    functions: typeof FunctionUtils;
    imports: typeof ImportUtils;
    variables: typeof VariableUtils;
    exports: typeof ExportUtils;
};

export function getJsAstEditor(ast: AstTypes.Program) {
    const astEditor: JsAstEditor = {
        ast,
        object: ObjectUtils,
        common: CommonUtils,
        array: ArrayUtils,
        functions: FunctionUtils,
        imports: ImportUtils,
        variables: VariableUtils,
        exports: ExportUtils,
    };

    return astEditor;
}
