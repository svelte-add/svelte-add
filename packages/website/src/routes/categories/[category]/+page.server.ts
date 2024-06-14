import { getAdderInfos } from "$lib/adder.js";
import { categories } from "@svelte-add/core";
import { availableCliOptions } from "@svelte-add/core/internal";
import type { CategoryKeys } from "../../../../../core/adder/categories.js";

export async function load({ params }) {
    const infos = await getAdderInfos(params.category);

    const keywords: string[] = [];
    for (const adders of infos.values()) {
        for (const adder of adders) {
            if (!adder.metadata.website) continue;

            keywords.push(...adder.metadata.website.keywords);
        }
    }

    return {
        adderCategories: infos,
        category: categories[params.category as CategoryKeys],
        keywords: keywords,
        availableCliOptions,
    };
}
