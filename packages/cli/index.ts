#!/usr/bin/env node

import {
    PromptOption,
    endPrompts,
    multiSelectPrompt,
    startPrompts,
    detectOrCreateProject,
    determineWorkingDirectory,
    executeAdder,
    remoteControl,
    suggestInstallingDependencies,
} from "@svelte-add/core/internal";
import { getAdderList, groupBy } from "./website";
import { program } from "commander";
import { categories } from "@svelte-add/core";
import { RemoteControlOptions } from "@svelte-add/core/adder/remoteControl";
import { AdderWithoutExplicitArgs } from "@svelte-add/core/adder/config";
import pkg from "./package.json";

executeCli();

async function executeCli() {
    console.log(`${pkg.name}@${pkg.version}`);

    remoteControl.enable();

    const addersList = await getAdderList();
    const adders = [];

    for (const adderName of addersList) {
        adders.push(await getAdderConfig(adderName));
    }

    const options = prepareCli(adders);
    let addersToApply = options.adder as string[];
    if (!addersToApply || addersToApply.length == 0) {
        addersToApply = await askForAddersToApply(adders);
    }
    const filteredAdders = adders.filter((x) => addersToApply.includes(x.config.metadata.id));

    let workingDirectory = determineWorkingDirectory(options);
    workingDirectory = await detectOrCreateProject(workingDirectory);

    for (const adder of filteredAdders) {
        const adderId = adder.config.metadata.id;
        const adderOptions = {};
        for (const [key, value] of Object.entries(options)) {
            if (!key || !key.startsWith(adderId)) continue;

            const optionKey = lowercaseFirstLetter(key.replace(adderId, ""));

            let optionValue = value;
            if (optionValue === "true") optionValue = true;
            else if (optionValue === "false") optionValue = false;

            adderOptions[optionKey] = optionValue;
        }

        const remoteControlledOptions: RemoteControlOptions = {
            workingDirectory,
            optionValues: adderOptions,
            isTesting: false,
        };

        await executeAdder(adder.config, adder.checks, remoteControlledOptions);
    }

    await suggestInstallingDependencies(workingDirectory);

    remoteControl.disable();
}

function lowercaseFirstLetter(string: string) {
    return string.charAt(0).toLocaleLowerCase() + string.slice(1);
}

async function getAdderConfig(name: string) {
    const adder = await import(`../../adders/${name}/build/index.js`);

    return adder.default as AdderWithoutExplicitArgs;
}

function prepareCli(adders: AdderWithoutExplicitArgs[]) {
    program.option("--path <string>", "Path to working directory");
    program.option("--adder <string...>", "List of adders to install");

    for (const adder of adders) {
        const adderId = adder.config.metadata.id;
        for (const [key, value] of Object.entries(adder.config.options)) {
            program.option(`--${adderId}-${key} <string>`, value.question);
        }
    }

    program.parse();
    const options = program.opts();

    return options;
}

async function askForAddersToApply(adders: AdderWithoutExplicitArgs[]): Promise<string[]> {
    startPrompts("Please select the tools you want to add");

    const groupedByCategory = groupBy(adders, (x) => x.config.metadata.category.id);
    const selectedAdders: string[] = [];
    const totalCategories = Object.keys(categories).length;
    let currentCategory = 0;

    for (const [categoryId, adders] of groupedByCategory) {
        currentCategory++;
        const categoryDetails = categories[categoryId];

        const promptOptions: PromptOption[] = [];
        for (const adder of adders) {
            const adderMetadata = adder.config.metadata;
            promptOptions.push({
                label: adderMetadata.name,
                value: adderMetadata.id,
                hint: adderMetadata.description,
            });
        }

        const promptDescription = `${categoryDetails.name} (${currentCategory} / ${totalCategories})`;
        const selectedValues = await multiSelectPrompt(promptDescription, promptOptions);
        selectedAdders.push(...selectedValues);
    }

    endPrompts("Thanks!");

    return selectedAdders;
}
