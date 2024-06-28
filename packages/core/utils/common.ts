import { parseJson } from "@svelte-add/ast-tooling";
import { commonFilePaths, readFile } from "../files/utils.js";
import type { WorkspaceWithoutExplicitArgs } from "./workspace.js";

export type Package = {
    name: string;
    version: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    bugs?: string;
    repository?: { type: string; url: string };
    keywords?: string[];
};

export async function getPackageJson(workspace: WorkspaceWithoutExplicitArgs) {
    const packageText = await readFile(workspace, commonFilePaths.packageJsonFilePath);
    if (!packageText) {
        return {
            text: "",
            data: {
                dependencies: {},
                devDependencies: {},
                name: "",
                version: "",
            },
        };
    }

    const packageJson: Package = parseJson(packageText) as Package;
    return {
        text: packageText,
        data: packageJson,
    };
}
