import { type AstTypes, parseScript } from "@svelte-add/ast-tooling";
import { getPackageJson } from "./common.js";
import { commonFilePaths, readFile } from "../files/utils.js";
import { getJsAstEditor } from "@svelte-add/ast-manipulation";
import type { OptionDefinition, OptionValues, Question } from "../adder/options.js";

export type PrettierData = {
    installed: boolean;
};

export type TypescriptData = {
    installed: boolean;
};

export type SvelteKitData = {
    installed: boolean;
    libDirectory: string;
    routesDirectory: string;
};

export type Workspace<Args extends OptionDefinition> = {
    options: OptionValues<Args>;
    cwd: string;
    prettier: PrettierData;
    typescript: TypescriptData;
    kit: SvelteKitData;
};

export type WorkspaceWithoutExplicitArgs = Workspace<Record<string, Question>>;

export function createEmptyWorkspace<Args extends OptionDefinition>(): Workspace<Args> {
    return {
        options: {},
        cwd: "",
        prettier: {
            installed: false,
        },
        typescript: {
            installed: false,
        },
        kit: {
            installed: false,
            routesDirectory: "src/routes",
            libDirectory: "src/lib",
        },
    } as Workspace<Args>;
}

export function addPropertyToWorkspaceOption(workspace: WorkspaceWithoutExplicitArgs, optionKey: string, value: unknown) {
    if (value === "true") {
        value = true;
    }

    if (value === "false") {
        value = false;
    }

    Object.defineProperty(workspace.options, optionKey, {
        value,
        writable: true,
        enumerable: true,
        configurable: true,
    });
}

export async function populateWorkspaceDetails(workspace: WorkspaceWithoutExplicitArgs, workingDirectory: string) {
    workspace.cwd = workingDirectory;

    const { data: packageJson } = await getPackageJson(workspace);
    if (packageJson.devDependencies) {
        workspace.typescript.installed = "tslib" in packageJson.devDependencies;
        workspace.prettier.installed = "prettier" in packageJson.devDependencies;
        workspace.kit.installed = "@sveltejs/kit" in packageJson.devDependencies;
    }

    await parseSvelteConfigIntoWorkspace(workspace);
}

export async function parseSvelteConfigIntoWorkspace(workspace: WorkspaceWithoutExplicitArgs) {
    if (!workspace.kit.installed) return;
    const configText = await readFile(workspace, commonFilePaths.svelteConfigFilePath);
    const ast = parseScript(configText);
    const editor = getJsAstEditor(ast);

    const defaultExport = ast.body.find((s) => s.type === "ExportDefaultDeclaration");
    if (!defaultExport) throw Error("Missing default export in `svelte.config.js`");

    let objectExpression: AstTypes.ObjectExpression | undefined;
    if (defaultExport.declaration.type === "Identifier") {
        // e.g. `export default config;`
        const identifier = defaultExport.declaration;
        for (const declaration of ast.body) {
            if (declaration.type !== "VariableDeclaration") continue;

            const declarator = declaration.declarations.find(
                (d): d is AstTypes.VariableDeclarator =>
                    d.type === "VariableDeclarator" && d.id.type === "Identifier" && d.id.name === identifier.name,
            );

            if (declarator?.init?.type !== "ObjectExpression")
                throw Error("Unable to find svelte config object expression from `svelte.config.js`");

            objectExpression = declarator.init;
        }
    } else if (defaultExport.declaration.type === "ObjectExpression") {
        // e.g. `export default { ... };`
        objectExpression = defaultExport.declaration;
    }
    // We'll error out since we can't safely determine the config object
    if (!objectExpression) throw new Error("Unexpected svelte config shape from `svelte.config.js`");

    const kit = editor.object.property(objectExpression, "kit", editor.object.createEmpty());
    const files = editor.object.property(kit, "files", editor.object.createEmpty());
    const routes = editor.object.property(files, "routes", editor.common.createLiteral());
    const lib = editor.object.property(files, "lib", editor.common.createLiteral());

    if (routes.value) {
        workspace.kit.routesDirectory = routes.value as string;
    }
    if (lib.value) {
        workspace.kit.libDirectory = lib.value as string;
    }
}
