import { getAdderInfos } from '$lib/adder.js';
import { availableCliOptions } from '@svelte-add/core/internal';

export async function load() {
	const infos = await getAdderInfos();

	const keywords: string[] = [];
	for (const adders of infos.values()) {
		for (const adder of adders) {
			if (!adder.metadata.website) continue;

			keywords.push(...adder.metadata.website.keywords);
		}
	}

	return {
		adderCategories: infos,
		keywords,
		availableCliOptions,
	};
}
