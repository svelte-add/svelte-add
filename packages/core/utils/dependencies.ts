import { selectPrompt } from "./prompts";
import preferredPackageManager from "preferred-pm";
import { spinner } from "@svelte-add/clack-prompts";
import { executeCli } from "./cli.js";

/**
 * @param workingDirectory
 * @returns the install status of dependencies
 */
export async function suggestInstallingDependencies(workingDirectory: string): Promise<"installed" | "skipped"> {
    type PackageManager = keyof typeof packageManagers | undefined;
    const packageManagers = {
        npm: "npm install",
        pnpm: "pnpm install",
        yarn: "yarn",
        bun: "bun install",
    };

    // Note: The return type for this is incorrect. If a PM is not found, it returns `null`.
    const detectedPm = await preferredPackageManager(workingDirectory);
    let selectedPm: PackageManager;
    if (!detectedPm) {
        selectedPm = await selectPrompt("Which package manager do you want to install dependencies with?", undefined, [
            {
                label: "None",
                value: undefined,
            },
            ...Object.keys(packageManagers).map((x) => {
                return { label: x, value: x as PackageManager };
            }),
        ]);
    } else {
        selectedPm = detectedPm.name;
    }

    if (!selectedPm || !packageManagers[selectedPm]) {
        return "skipped";
    }

    const selectedCommand = packageManagers[selectedPm];
    const args = selectedCommand.split(" ");
    const command = args[0];
    args.splice(0, 1);

    const loadingSpinner = spinner();
    loadingSpinner.start("Installing dependencies...");
    await installDependencies(command, args, workingDirectory);
    loadingSpinner.stop("Successfully installed dependencies");
    return "installed";
}

async function installDependencies(command: string, args: string[], workingDirectory: string) {
    try {
        await executeCli(command, args, workingDirectory);
    } catch (error) {
        const typedError = error as Error;
        throw new Error("unable to install dependencies: " + typedError.message);
    }
}
