import { getAdderInfos } from "$lib/adder.js";
import { categories } from "@svelte-add/core";

export async function load({ params }) {
    const infos = await getAdderInfos(params.category);

    /** @type {string[]} */
    const keywords = [];
    for (const adders of infos.values()) {
        for (const adder of adders) {
            if (!adder.metadata.website) continue;

            keywords.push(...adder.metadata.website.keywords);
        }
    }

    return {
        adderCategories: infos,
        category: categories[params.category],
        keywords: keywords,
    };
}
