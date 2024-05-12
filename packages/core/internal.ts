import * as remoteControl from "./adder/remoteControl.js";
import { executeAdder, determineWorkingDirectory } from "./adder/execute.js";
import { createOrUpdateFiles } from "./files/processors.js";
import { createEmptyWorkspace, populateWorkspaceDetails } from "./utils/workspace.js";
import { detectOrCreateProject } from "./utils/create-project.js";
import { PromptOption, endPrompts, multiSelectPrompt, textPrompt, startPrompts } from "./utils/prompts.js";
import { suggestInstallingDependencies } from "./utils/dependencies.js";
import { executeCli } from "./utils/common.js";

export {
    remoteControl,
    createOrUpdateFiles,
    createEmptyWorkspace,
    executeAdder,
    populateWorkspaceDetails,
    determineWorkingDirectory,
    detectOrCreateProject,
    PromptOption,
    endPrompts,
    multiSelectPrompt,
    textPrompt,
    startPrompts,
    suggestInstallingDependencies,
    executeCli,
};
