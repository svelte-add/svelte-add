#!/usr/bin/env node

import { remoteControl, executeAdders, prompts } from '@svelte-add/core/internal';
import pkg from './package.json';
import type { Question } from '@svelte-add/core/adder/options';
import type {
	AdderDetails,
	AddersToApplySelectorParams,
	ExecutingAdderInfo,
} from '@svelte-add/core/adder/execute';
import { adderCategories, categories, adderIds } from '@svelte-add/config';
import type { CategoryKeys } from '@svelte-add/config';
import { getAdderDetails } from '@svelte-add/adders';

void executeCli();

async function executeCli() {
	remoteControl.enable();

	const adderDetails: AdderDetails<Record<string, Question>>[] = [];

	for (const adderName of adderIds) {
		const adder = await getAdderDetails(adderName);
		adderDetails.push({ config: adder.config, checks: adder.checks });
	}

	const executingAdderInfo: ExecutingAdderInfo = {
		name: pkg.name,
		version: pkg.version,
	};

	await executeAdders(adderDetails, executingAdderInfo, undefined, selectAddersToApply);

	remoteControl.disable();
}

type AdderOption = { value: string; label: string; hint: string };
async function selectAddersToApply({ projectType, addersMetadata }: AddersToApplySelectorParams) {
	const promptOptions: Record<string, AdderOption[]> = {};

	for (const [categoryId, adderIds] of Object.entries(adderCategories)) {
		const categoryDetails = categories[categoryId as CategoryKeys];
		const options: AdderOption[] = [];
		const adders = addersMetadata.filter((x) => adderIds.includes(x.id));

		for (const adder of adders) {
			// if we detected a kit project, and the adder is not available for kit, ignore it.
			if (projectType === 'kit' && !adder.environments.kit) continue;
			// if we detected a svelte project, and the adder is not available for svelte, ignore it.
			if (projectType === 'svelte' && !adder.environments.svelte) continue;

			options.push({
				label: adder.name,
				value: adder.id,
				hint: adder.website?.documentation || '',
			});
		}

		if (options.length > 0) {
			promptOptions[categoryDetails.name] = options;
		}
	}
	const selectedAdders = await prompts.groupedMultiSelectPrompt(
		'What would you like to add to your project?',
		promptOptions,
	);

	return selectedAdders;
}
