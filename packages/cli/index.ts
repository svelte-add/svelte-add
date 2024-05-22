#!/usr/bin/env node

import { remoteControl, executeAdders } from "@svelte-add/core/internal";
import { getAdderList } from "./website";
import type { RemoteControlOptions } from "@svelte-add/core/adder/remoteControl";
import type { AdderWithoutExplicitArgs } from "@svelte-add/core/adder/config";
import pkg from "./package.json";
import type { Question } from "@svelte-add/core/adder/options";
import type { AdderDetails, ExecutingAdderInfo } from "@svelte-add/core/adder/execute";

executeCli();

async function executeCli() {
    remoteControl.enable();

    const addersList = await getAdderList();
    const adderDetails: AdderDetails<Record<string, Question>>[] = [];

    for (const adderName of addersList) {
        const adder = await getAdderConfig(adderName);
        adderDetails.push({ config: adder.config, checks: adder.checks });
    }

    const executingAdderInfo: ExecutingAdderInfo = {
        name: pkg.name,
        version: pkg.version,
    };

    await executeAdders(adderDetails, executingAdderInfo);

    remoteControl.disable();
}

async function getAdderConfig(name: string) {
    const adder = await import(`../../adders/${name}/build/index.js`);

    return adder.default as AdderWithoutExplicitArgs;
}
