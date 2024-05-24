import * as remoteControl from "./adder/remoteControl.js";
import { executeAdder, executeAdders, determineWorkingDirectory } from "./adder/execute.js";
import { createOrUpdateFiles } from "./files/processors.js";
import { createEmptyWorkspace, populateWorkspaceDetails } from "./utils/workspace.js";
import { detectOrCreateProject } from "./utils/create-project.js";
import { PromptOption, endPrompts, multiSelectPrompt, textPrompt, startPrompts } from "./utils/prompts.js";
import { suggestInstallingDependencies } from "./utils/dependencies.js";

export {
    remoteControl,
    createOrUpdateFiles,
    createEmptyWorkspace,
    executeAdder,
    executeAdders,
    populateWorkspaceDetails,
    determineWorkingDirectory,
    detectOrCreateProject,
    PromptOption,
    endPrompts,
    multiSelectPrompt,
    textPrompt,
    startPrompts,
    suggestInstallingDependencies,
};
