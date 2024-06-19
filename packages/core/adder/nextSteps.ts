import { messagePrompt } from "../utils/prompts";
import { InlineAdderConfig } from "./config";
import { AdderDetails } from "./execute";
import { OptionDefinition } from "./options";
import { green } from "picocolors";

export function displayNextSteps<Args extends OptionDefinition>(adderDetails: AdderDetails<Args>[], multipleAdders: boolean) {
    const allAddersMessage = adderDetails
        .filter((x) => x.config.integrationType == "inline" && x.config.nextSteps)
        .map((x) => x.config as InlineAdderConfig<Args>)
        .map((x) => {
            // only doing this to narrow the type, `nextSteps` should already exist here
            if (!x.nextSteps) return "";
            const metadata = x.metadata;
            let adderMessage = "";
            if (multipleAdders) {
                adderMessage = `${green(metadata.name)}:\n`;
            }
            const adderNextSteps = x.nextSteps();
            adderMessage += `- ${adderNextSteps.join("\n- ")}`;
            return adderMessage;
        })
        .join("\n\n");
    messagePrompt("Next steps", allAddersMessage);
}
