import { getAdderConfig, getAdderList } from "svelte-add/website";
import { groupBy } from "@svelte-add/core/internal";

/**
 * @typedef AdderMetadataWithOptions
 * @property {import("../../../core/adder/config").AdderConfigMetadata} metadata
 * @property {Record<string, import("../../../core/adder/options").Question> | null} options
 */

/**
 *
 * @param {string} [category]
 * @returns
 */
export async function getAdderInfos(category) {
    const addersNames = getAdderList();

    /** @type {AdderMetadataWithOptions[]} */
    const adders = [];
    for (const adderName of addersNames) {
        const config = await getAdderDetails(adderName);

        if (category && config.metadata.category.id !== category) {
            continue;
        }

        adders.push(config);
    }

    const groupedByCategory = groupAddersByCategory(adders);

    return groupedByCategory;
}

/**
 *
 * @param {string} name
 * @returns {Promise<AdderMetadataWithOptions>}
 */
export async function getAdderDetails(name) {
    const config = await getAdderConfig(name);

    return {
        metadata: config.metadata,
        options: config.options,
    };
}

/**
 * @param {AdderMetadataWithOptions[]} adders
 * @returns {Map<import("../../../core/adder/categories").CategoryInfo, AdderMetadataWithOptions[]>}
 */
function groupAddersByCategory(adders) {
    return groupBy(adders, (adder) => adder.metadata.category);
}
