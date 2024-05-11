import { spawn } from "child_process";
import { endPrompts, selectPrompt, startPrompts } from "./prompts";
import preferredPackageManager from "preferred-pm";
import { spinner, note } from "@clack/prompts";

export async function suggestInstallingDependencies(workingDirectory: string) {
    const detectedPm = await preferredPackageManager(workingDirectory);
    const packageManagers = {
        npm: "npm install",
        pnpm: "pnpm install",
        yarn: "yarn",
        bun: "bun install",
    };
    startPrompts("Dependencies");
    const selectedPm = (await selectPrompt("Which package manager to want to install dependencies with?", detectedPm.name, [
        {
            label: "None",
            value: undefined,
        },
        ...Object.keys(packageManagers).map((x) => {
            return { label: x, value: x };
        }),
    ])) as string;

    if (!selectedPm || !packageManagers[selectedPm]) {
        endPrompts("Skipped installing dependencies");
        return;
    }

    const selectedCommand = packageManagers[selectedPm] as string;
    const args = selectedCommand.split(" ");
    const command = args[0];
    args.splice(0, 1);

    const loadingSpinner = spinner();
    loadingSpinner.start("Installing");
    await installDependencies(command, args, workingDirectory);
    loadingSpinner.stop("Done");

    endPrompts("You're all set!");
}

async function installDependencies(command: string, args: string[], workingDirectory: string) {
    const program = await spawn(command, args, { shell: true, cwd: workingDirectory });
    await new Promise((resolve) => {
        program.on("exit", (code) => {
            if (code == 0) {
                resolve(1);
            } else {
                throw new Error("unable to install dependencies");
            }
        });
    });
}
