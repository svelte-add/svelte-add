import { booleanPrompt, endPrompts, messagePrompt } from "../utils/prompts.js";
import { AdderDetails } from "./execute.js";
import { OptionDefinition } from "./options.js";
import pc from "picocolors";
import { Precondition } from "./config.js";
import { executeCli } from "../utils/common.js";

function getGlobalPreconditions(
    executingCli: string,
    workingDirectory: string,
): { name: string; preconditions: Precondition[] | undefined } {
    return {
        name: executingCli,
        preconditions: [
            {
                name: "clean working directory",
                run: async () => {
                    let outputText = "";

                    try {
                        // If a user has pending git changes the output of the following command will list
                        // all files that have been added/modified/deleted and thus the output will not be empty.
                        // In case the output of the command below is an empty text, we can safely assume
                        // there are no pending changes. If the below command is run outside of a git repository,
                        // git will exit with a failing exit code, which will trigger the catch statement.
                        // also see https://remarkablemark.org/blog/2017/10/12/check-git-dirty/#git-status
                        await executeCli("git", ["status", "--short"], workingDirectory, {
                            onData: (data) => {
                                outputText += data;
                            },
                        });

                        if (outputText) {
                            return { success: false, message: "Found modified files" };
                        }

                        return { success: true, message: undefined };
                    } catch (error) {
                        return { success: false, message: "Not a git repository" };
                    }
                },
            },
        ],
    };
}

export async function validatePreconditions<Args extends OptionDefinition>(
    adderDetails: AdderDetails<Args>[],
    executingCliName: string,
    workingDirectory: string,
    isTesting: boolean,
) {
    const multipleAdders = adderDetails.length > 1;
    let allPreconditionsPassed = true;
    const preconditionLog: string[] = [];

    const adderPreconditions = adderDetails.map(({ config, checks }) => {
        return {
            name: config.metadata.name,
            preconditions: checks.preconditions,
        };
    });
    const combinedPreconditions = isTesting
        ? adderPreconditions
        : [getGlobalPreconditions(executingCliName, workingDirectory), ...adderPreconditions];

    for (const { name, preconditions } of combinedPreconditions) {
        if (!preconditions) continue;

        for (const precondition of preconditions) {
            let message;
            let preconditionPassed;
            try {
                const result = await precondition.run();

                if (result.success) {
                    message = precondition.name;
                    preconditionPassed = true;
                } else {
                    preconditionPassed = false;
                    message = `${precondition.name} (${result.message ?? "No failure message provided"})`;
                }
            } catch (error) {
                const errorString = error as string;
                preconditionPassed = false;
                message = precondition.name + ` (Unexpected failure: ${errorString})`;
            }

            if (!preconditionPassed) {
                if (multipleAdders) {
                    message = `${name}: ${message}`;
                }

                message = pc.yellow(message);
                preconditionLog.push(message);
            }

            if (!preconditionPassed) allPreconditionsPassed = false;
        }
    }

    if (allPreconditionsPassed) {
        return;
    } else if (!allPreconditionsPassed && isTesting) {
        throw new Error(`Preconditions failed: ${preconditionLog.join(" / ")}`);
    }

    let allMessages = "";
    for (const [i, message] of preconditionLog.entries()) {
        allMessages += `- ${message}${i == preconditionLog.length - 1 ? "" : "\n"}`;
    }

    messagePrompt("Preconditions not met", allMessages);

    if (!allPreconditionsPassed) {
        await askUserToContinueWithFailedPreconditions();
    }
}

export async function askUserToContinueWithFailedPreconditions() {
    const result = await booleanPrompt("Preconditions failed. Do you wish to continue?", false);

    if (!result) {
        endPrompts("Exiting.");
        process.exit();
    }
}
