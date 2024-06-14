import { selectPrompt } from "./prompts";
import preferredPackageManager from "preferred-pm";
import { spinner } from "@clack/prompts";
import { executeCli } from "./common";

export async function suggestInstallingDependencies(workingDirectory: string) {
    type PackageManager = keyof typeof packageManagers | undefined;
    const packageManagers = {
        // Prevents npm from crashing if the peer-deps don't match.
        npm: "npm install --legacy-peer-deps",
        // All of the other PMs should handle this more gracefully by default
        pnpm: "pnpm install",
        yarn: "yarn",
        bun: "bun install",
    };

    // Note: The return type for this is incorrect. If a PM is not found, it returns `null`.
    const detectedPm = await preferredPackageManager(workingDirectory);
    let selectedPm: PackageManager;
    if (!detectedPm) {
        selectedPm = await selectPrompt("Which package manager to want to install dependencies with?", undefined, [
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
        return;
    }

    const selectedCommand = packageManagers[selectedPm];
    const args = selectedCommand.split(" ");
    const command = args[0];
    args.splice(0, 1);

    const loadingSpinner = spinner();
    loadingSpinner.start("Installing dependencies...");
    await installDependencies(command, args, workingDirectory);
    loadingSpinner.stop("Successfully installed dependencies");
}

async function installDependencies(command: string, args: string[], workingDirectory: string) {
    try {
        await executeCli(command, args, workingDirectory);
    } catch (error) {
        const errorString = error as string;
        throw new Error("unable to install dependencies: " + errorString);
    }
}
