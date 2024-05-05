import { getAdderInfos } from "$lib/adder";

/** @type {import('./$types').PageServerLoad} */
export async function load() {
    const infos = await getAdderInfos();

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
        keywords,
    };
}
