import path from "node:path";
import { commonFilePaths, directoryExists, fileExists } from "../files/utils.js";
import { type PromptOption, booleanPrompt, selectPrompt, textPrompt, endPrompts } from "./prompts.js";
import { getPackageJson } from "./common.js";
import { createEmptyWorkspace } from "./workspace.js";
import { spinner } from "@svelte-add/clack-prompts";
import { executeCli } from "./cli.js";

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

export async function createProject(cwd: string, supportKit: boolean, supportSvelte: boolean) {
    const createNewProject = await booleanPrompt("Create new Project?", true);
    if (!createNewProject) {
        endPrompts("Exiting.");
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

    const availableProjectTypes: PromptOption<string>[] = [];
    if (supportKit) availableProjectTypes.push({ label: "SvelteKit", value: "kit" });
    if (supportSvelte) availableProjectTypes.push({ label: "Svelte", value: "svelte" });

    let projectType: string;

    if (availableProjectTypes.length == 0) throw new Error("Failed to identify possible project types");
    if (availableProjectTypes.length == 1) projectType = availableProjectTypes[0].value;
    else projectType = await selectPrompt("Which project type do you want to create?", "kit", availableProjectTypes);

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
