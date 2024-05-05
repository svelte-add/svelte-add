import { AdderWithoutExplicitArgs } from "@svelte-add/core/adder/config";
import { OptionValues, Question } from "@svelte-add/core/adder/options";
import { RemoteControlOptions } from "@svelte-add/core/adder/remoteControl";
import { createEmptyWorkspace, createOrUpdateFiles, executeAdder, populateWorkspaceDetails } from "@svelte-add/core/internal";

export async function runAdder(
    adder: AdderWithoutExplicitArgs,
    workingDirectory: string,
    optionValues: OptionValues<Record<string, Question>>,
) {
    const remoteControlledOptions: RemoteControlOptions = { workingDirectory, optionValues, isTesting: true };

    await executeAdder(adder.config, adder.checks, remoteControlledOptions);

    const workspace = createEmptyWorkspace();
    workspace.cwd = workingDirectory;
    workspace.options = optionValues;

    await populateWorkspaceDetails(workspace, workingDirectory);
    await createOrUpdateFiles(adder.tests.files, workspace);
}
