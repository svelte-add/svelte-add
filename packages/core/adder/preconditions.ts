import { booleanPrompt, endPrompts, messagePrompt } from "../utils/prompts.js";
import { AdderDetails } from "./execute.js";
import { OptionDefinition } from "./options.js";
import pc from "picocolors";
import { Precondition } from "./config.js";
import { executeCli } from "../utils/common.js";

function getGlobalPreconditions(executingCli: string): { name: string; preconditions: Precondition[] | undefined } {
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
                        await executeCli("git", ["status", "--short"], process.cwd(), {
                            onData: (data, program, resolve) => {
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
    const combinedPreconditions = [getGlobalPreconditions(executingCliName), ...adderPreconditions];

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
                preconditionPassed = false;
                message = precondition.name + ` (Unexpected failure: ${error})`;
            }

            if (multipleAdders) {
                message = `${name}: ${message}`;
            }

            message = preconditionPassed ? pc.green(message) : pc.yellow(message);
            preconditionLog.push(message);

            if (!preconditionPassed) allPreconditionsPassed = false;
        }
    }
    if (preconditionLog.length > 0) {
        let allMessages = "";
        for (const [i, message] of preconditionLog.entries()) {
            allMessages += `- ${message}${i == preconditionLog.length - 1 ? "" : "\n"}`;
        }

        if (!allPreconditionsPassed && isTesting) {
            throw new Error(`Preconditions failed: ${preconditionLog.join(" / ")}`);
        }

        if (isTesting) return;

        messagePrompt("Preconditions:", allMessages);

        if (!allPreconditionsPassed) {
            await askUserToContinueWithFailedPreconditions();
        }
    }
}

export async function askUserToContinueWithFailedPreconditions() {
    const result = await booleanPrompt("Preconditions failed. Do you wish to continue?", false);

    if (!result) {
        endPrompts("Exiting.");
        process.exit();
    }
}
