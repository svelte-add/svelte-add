import { config } from "process";
import { booleanPrompt, endPrompts, messagePrompt } from "../utils/prompts.js";
import { AdderDetails } from "./execute.js";
import { OptionDefinition } from "./options.js";
import pc from "picocolors";

export async function validatePreconditions<Args extends OptionDefinition>(
    adderDetails: AdderDetails<Args>[],
    isTesting: boolean,
) {
    const multipleAdders = adderDetails.length > 1;
    let allPreconditionsPassed = true;
    const preconditionLog: string[] = [];
    for (const { config, checks } of adderDetails) {
        if (!checks.preconditions) continue;

        for (const precondition of checks.preconditions) {
            let message;
            let preconditionPassed;
            try {
                const result = precondition.run();

                if (result.success) {
                    message = precondition.name;
                    preconditionPassed = true;
                } else {
                    preconditionPassed = false;
                    message = `${precondition.name} (${result.message ?? "No failure message provided"})`;
                }
            } catch (error) {
                preconditionPassed = false;
                message = precondition.name + `(Unexpected failure: ${error})`;
            }

            if (multipleAdders) {
                message = `${config.metadata.name}: ${message}`;
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
