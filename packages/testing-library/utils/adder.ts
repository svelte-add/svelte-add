import type { AdderWithoutExplicitArgs } from "@svelte-add/core/adder/config";
import type { OptionValues, Question } from "@svelte-add/core/adder/options";
import type { RemoteControlOptions } from "@svelte-add/core/adder/remoteControl";
import { createEmptyWorkspace, createOrUpdateFiles, executeAdder, populateWorkspaceDetails } from "@svelte-add/core/internal";

export async function runAdder(
    adder: AdderWithoutExplicitArgs,
    workingDirectory: string,
    optionValues: OptionValues<Record<string, Question>>,
) {
    const adderOptions: Record<string, OptionValues<Record<string, Question>>> = {};
    adderOptions[adder.config.metadata.id] = optionValues;
    const remoteControlOptions: RemoteControlOptions = { workingDirectory, isTesting: true, adderOptions };

    await executeAdder(
        { config: adder.config, checks: adder.checks },
        { name: "testing-cli", version: "tbd" },
        remoteControlOptions,
    );

    const workspace = createEmptyWorkspace();
    workspace.cwd = workingDirectory;
    workspace.options = optionValues;

    await populateWorkspaceDetails(workspace, workingDirectory);
    await createOrUpdateFiles(adder.tests?.files ?? [], workspace);
}
