import { messagePrompt } from "../utils/prompts";
import { InlineAdderConfig } from "./config";
import { AdderDetails } from "./execute";
import { OptionDefinition } from "./options";
import { green } from "picocolors";

export function displayNextSteps<Args extends OptionDefinition>(adderDetails: AdderDetails<Args>[], multipleAdders: boolean) {
    const allAddersMessage = adderDetails
        .filter((x) => x.config.integrationType == "inline")
        .map((x) => x.config as InlineAdderConfig<Args>)
        .map((x) => {
            const metadata = x.metadata;
            let adderMessage = "";
            if (multipleAdders) {
                adderMessage = `${green(metadata.name)}:\n`;
            }

            if (metadata.website) adderMessage += `docs: ${metadata.website.documentation}`;

            if (x.nextSteps) {
                const adderNextSteps = x.nextSteps();
                if (adderNextSteps) adderMessage += `\n${adderNextSteps}`;
            }

            return adderMessage;
        })
        .join("\n\n");
    messagePrompt("Next steps", allAddersMessage);
}
