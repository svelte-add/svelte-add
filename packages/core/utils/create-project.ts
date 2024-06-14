import * as path from "path";
import { booleanPrompt, selectPrompt, textPrompt } from "./prompts.js";
import { commonFilePaths, directoryExists, fileExists } from "../files/utils.js";
import { executeCli, getPackageJson } from "./common.js";
import { createEmptyWorkspace } from "./workspace.js";
import { spinner } from "@clack/prompts";

export type ProjectType = "svelte" | "kit";

export async function detectSvelteDirectory(directoryPath: string): Promise<string | null> {
    if (!directoryPath) return null;

    const packageJsonPath = path.join(directoryPath, commonFilePaths.packageJsonFilePath);
    const parentDirectoryPath = path.normalize(path.join(directoryPath, ".."));
    const isRoot = parentDirectoryPath == directoryPath;

    if (!isRoot && !(await directoryExists(directoryPath))) {
        return await detectSvelteDirectory(parentDirectoryPath);
    }

    if (!isRoot && !(await fileExists(packageJsonPath))) {
        return await detectSvelteDirectory(parentDirectoryPath);
    }

    if (isRoot && !(await fileExists(packageJsonPath))) {
        return null;
    }

    const emptyWorkspace = createEmptyWorkspace();
    emptyWorkspace.cwd = directoryPath;
    const { data: packageJson } = await getPackageJson(emptyWorkspace);

    if (packageJson.devDependencies && "svelte" in packageJson.devDependencies) {
        return directoryPath;
    } else if (!isRoot) {
        return await detectSvelteDirectory(parentDirectoryPath);
    }

    return null;
}

export async function createProject(cwd: string) {
    const createNewProject = await booleanPrompt("Create new Project?", true);
    if (!createNewProject) {
        console.log("New project should not be created. Exiting.");
        process.exit(0);
    }

    let relativePath = path.relative(process.cwd(), cwd);
    if (!relativePath) {
        relativePath = "./";
    }

    let directory = await textPrompt("Where should we create your project?", `  (hit Enter to use '${relativePath}')`);
    if (!directory) {
        directory = relativePath;
    }

    const projectType = await selectPrompt("Which project type do you want to create?", "kit", [
        { label: "SvelteKit", value: "kit" },
        { label: "Svelte", value: "svelte" },
    ]);

    let language = "js";
    if (projectType == "svelte") {
        language = await selectPrompt("Choose language", language, [
            { label: "JavaScript", value: "js" },
            { label: "TypeScript", value: "ts" },
        ]);
    }

    let args = [];
    if (projectType == "kit") {
        args = ["init", "svelte@latest", directory];
    } else {
        const template = language == "ts" ? "svelte-ts" : "svelte";
        args = ["init", "vite@latest", directory, "--", "--template", template];
    }

    const loadingSpinner = spinner();
    loadingSpinner.start("Initializing template...");

    try {
        loadingSpinner.stop("Downloading initializer cli...");

        await executeCli("npm", args, process.cwd(), { stdio: "inherit" });

        console.clear();
    } catch (error) {
        loadingSpinner.stop("Failed initializing template!");
        const typedError = error as Error;
        console.log("cancelled or failed " + typedError.message);
        return { projectCreated: false, directory: "" };
    }

    loadingSpinner.stop("Template initialized");

    return {
        projectCreated: true,
        directory: path.join(process.cwd(), directory),
    };
}
