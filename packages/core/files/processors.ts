import {
    CssAstEditor,
    HtmlAstEditor,
    JsAstEditor,
    SvelteAstEditor,
    getCssAstEditor,
    getHtmlAstEditor,
    getJsAstEditor,
} from "@svelte-add/ast-manipulation";
import {
    parseHtml,
    parseJson,
    parsePostcss,
    parseScript,
    parseSvelteFile,
    serializeHtml,
    serializeJson,
    serializePostcss,
    serializeScript,
    serializeSvelteFile,
} from "@svelte-add/ast-tooling";
import { fileExistsWorkspace, format, readFile, writeFile } from "./utils.js";
import { ConditionDefinition } from "../adder/config.js";
import { OptionDefinition } from "../adder/options.js";
import { Workspace } from "../utils/workspace.js";

export type BaseFile<Args extends OptionDefinition> = {
    name: (options: Workspace<Args>) => string;
    condition?: ConditionDefinition<Args>;
};

export type ScriptFileEditorArgs<Args extends OptionDefinition> = JsAstEditor & Workspace<Args>;
export type ScriptFileType<Args extends OptionDefinition> = {
    contentType: "script";
    content: (editor: ScriptFileEditorArgs<Args>) => void;
};
export type ScriptFile<Args extends OptionDefinition> = ScriptFileType<Args> & BaseFile<Args>;

export type TextFileEditorArgs<Args extends OptionDefinition> = { content: string } & Workspace<Args>;
export type TextFileType<Args extends OptionDefinition> = {
    contentType: "text";
    content: (editor: TextFileEditorArgs<Args>) => string;
};
export type TextFile<Args extends OptionDefinition> = TextFileType<Args> & BaseFile<Args>;

export type SvelteFileEditorArgs<Args extends OptionDefinition> = SvelteAstEditor & Workspace<Args>;
export type SvelteFileType<Args extends OptionDefinition> = {
    contentType: "svelte";
    content: (editor: SvelteFileEditorArgs<Args>) => void;
};
export type SvelteFile<Args extends OptionDefinition> = SvelteFileType<Args> & BaseFile<Args>;

export type JsonFileEditorArgs<Args extends OptionDefinition> = { data: any } & Workspace<Args>;
export type JsonFileType<Args extends OptionDefinition> = {
    contentType: "json";
    content: (editor: JsonFileEditorArgs<Args>) => void;
};
export type JsonFile<Args extends OptionDefinition> = JsonFileType<Args> & BaseFile<Args>;

export type HtmlFileEditorArgs<Args extends OptionDefinition> = HtmlAstEditor & Workspace<Args>;
export type HtmlFileType<Args extends OptionDefinition> = {
    contentType: "html";
    content: (editor: HtmlFileEditorArgs<Args>) => void;
};
export type HtmlFile<Args extends OptionDefinition> = HtmlFileType<Args> & BaseFile<Args>;

export type CssFileEditorArgs<Args extends OptionDefinition> = CssAstEditor & Workspace<Args>;
export type CssFileType<Args extends OptionDefinition> = {
    contentType: "css";
    content: (editor: CssFileEditorArgs<Args>) => void;
};
export type CssFile<Args extends OptionDefinition> = CssFileType<Args> & BaseFile<Args>;

export type FileTypes<Args extends OptionDefinition> =
    | ScriptFile<Args>
    | TextFile<Args>
    | SvelteFile<Args>
    | JsonFile<Args>
    | HtmlFile<Args>
    | CssFile<Args>;

export async function createOrUpdateFiles<Args extends OptionDefinition>(files: FileTypes<Args>[], workspace: Workspace<Args>) {
    for (const fileDetails of files) {
        if (fileDetails.condition && !fileDetails.condition(workspace)) {
            continue;
        }

        const exists = await fileExistsWorkspace(workspace, fileDetails.name(workspace));

        let content = "";
        if (!exists) {
            content = "";
        } else {
            content = await readFile(workspace, fileDetails.name(workspace));
        }

        if (fileDetails.contentType == "script") {
            content = handleScriptFile(content, fileDetails, workspace);
        } else if (fileDetails.contentType == "text") {
            content = handleTextFile(content, fileDetails, workspace);
        } else if (fileDetails.contentType == "svelte") {
            content = handleSvelteFile(content, fileDetails, workspace);
        } else if (fileDetails.contentType == "json") {
            content = handleJsonFile(content, fileDetails, workspace);
        } else if (fileDetails.contentType == "css") {
            content = handleCssFile(content, fileDetails, workspace);
        } else if (fileDetails.contentType == "html") {
            content = handleHtmlFile(content, fileDetails, workspace);
        }

        content = await format(workspace, fileDetails.name(workspace), content);
        await writeFile(workspace, fileDetails.name(workspace), content);
    }
}

function handleHtmlFile<Args extends OptionDefinition>(
    content: string,
    fileDetails: HtmlFileType<Args>,
    workspace: Workspace<Args>,
) {
    const ast = parseHtml(content);
    fileDetails.content({ ...getHtmlAstEditor(ast), ...workspace });
    content = serializeHtml(ast);
    return content;
}

function handleCssFile<Args extends OptionDefinition>(
    content: string,
    fileDetails: CssFileType<Args>,
    workspace: Workspace<Args>,
) {
    const ast = parsePostcss(content);
    fileDetails.content({ ...getCssAstEditor(ast), ...workspace });
    content = serializePostcss(ast);
    return content;
}

function handleJsonFile<Args extends OptionDefinition>(
    content: string,
    fileDetails: JsonFileType<Args>,
    workspace: Workspace<Args>,
) {
    const data = parseJson(content);
    fileDetails.content({ data, ...workspace });
    content = serializeJson(content, data);
    return content;
}

function handleSvelteFile<Args extends OptionDefinition>(
    content: string,
    fileDetails: SvelteFileType<Args>,
    workspace: Workspace<Args>,
) {
    const { jsAst, htmlAst, cssAst } = parseSvelteFile(content);

    fileDetails.content({
        js: getJsAstEditor(jsAst),
        html: getHtmlAstEditor(htmlAst),
        css: getCssAstEditor(cssAst),
        ...workspace,
    });

    return serializeSvelteFile({ jsAst, htmlAst, cssAst });
}

function handleTextFile<Args extends OptionDefinition>(
    content: string,
    fileDetails: TextFileType<Args>,
    workspace: Workspace<Args>,
) {
    content = fileDetails.content({ content, ...workspace });
    return content;
}

function handleScriptFile<Args extends OptionDefinition>(
    content: string,
    fileDetails: ScriptFileType<Args>,
    workspace: Workspace<Args>,
) {
    const ast = parseScript(content);

    fileDetails.content({
        ...getJsAstEditor(ast),
        ...workspace,
    });
    content = serializeScript(ast);
    return content;
}
