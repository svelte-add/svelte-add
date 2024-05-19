import { booleanPrompt } from "../utils/prompts.js";
import { Precondition } from "./config.js";

export type PreconditionCheckResult = {
    successfulPreconditions: string[];
    failedPreconditions: { name: string; message: string }[];
    autoApplyAdder: boolean;
};

export function checkPreconditionsStatus(preconditions: Precondition[]) {
    const status: PreconditionCheckResult = {
        successfulPreconditions: [],
        failedPreconditions: [],
        autoApplyAdder: true,
    };

    for (const precondition of preconditions) {
        try {
            const result = precondition.run();

            if (result.success) {
                status.successfulPreconditions.push(precondition.name);
            } else {
                status.failedPreconditions.push({
                    name: precondition.name,
                    message: result.message ?? "No failure message provided",
                });
            }
        } catch (error) {
            status.failedPreconditions.push({ name: precondition.name, message: "Unexpected failure: " + error });
        }
    }

    status.autoApplyAdder = status.failedPreconditions.length == 0;

    return status;
}

export function printPreconditionResults(preconditionStatus: PreconditionCheckResult) {
    if (preconditionStatus.successfulPreconditions.length == 0 && preconditionStatus.failedPreconditions.length == 0) {
        return;
    }

    const preconditionMessages: { success: boolean; message: string }[] = [];
    for (const preconditionResult of preconditionStatus.successfulPreconditions) {
        preconditionMessages.push({ success: true, message: preconditionResult });
    }
    for (const preconditionResult of preconditionStatus.failedPreconditions) {
        preconditionMessages.push({ success: false, message: `${preconditionResult.name} (${preconditionResult.message})` });
    }

    // sort the elements alphabetically by message
    preconditionMessages.sort((a, b) => a.message.localeCompare(b.message));

    console.log("Preconditions:");
    for (const messageData of preconditionMessages) {
        const symbol = messageData.success ? "✅" : "❌";
        console.log(`  - ${symbol} ${messageData.message}`);
    }

    console.log(""); // force a new line after the precondition output
}

export async function askUserToContinueWithFailedPreconditions() {
    const result = await booleanPrompt("Preconditions failed. Do you wish to continue?", false);

    if (!result) process.exit();
}
