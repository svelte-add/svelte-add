import { getAdderConfig, getAdderList } from "svelte-add/website";
import { groupBy } from "@svelte-add/core/internal";
import type { Question } from "../../../core/adder/options.js";
import type { AdderConfigMetadata } from "../../../core/adder/config.js";
import type { CategoryInfo } from "../../../core/adder/categories.js";

export type AdderMetadataWithOptions = {
    metadata: AdderConfigMetadata;
    options: Question | null;
};

export async function getAdderInfos(category?: string) {
    const addersNames = getAdderList();

    const adders: AdderMetadataWithOptions[] = [];
    for (const adderName of addersNames) {
        const config = await getAdderDetails(adderName);
        serializeConditions(config);

        if (category && config.metadata.category.id !== category) {
            continue;
        }

        adders.push(config);
    }

    const groupedByCategory = groupAddersByCategory(adders);

    return groupedByCategory;
}

// serializes the functions that evaluate a question's conditions
function serializeConditions(adder: AdderMetadataWithOptions) {
    for (const question of Object.values(adder.options!)) {
        if (question?.condition) {
            question.condition = question.condition.toString();
        }
    }
}

export async function getAdderDetails(name: string): Promise<AdderMetadataWithOptions> {
    const config = await getAdderConfig(name);
    serializeConditions(config);

    return {
        metadata: config.metadata,
        options: config.options,
    };
}

function groupAddersByCategory(adders: AdderMetadataWithOptions[]): Map<CategoryInfo, AdderMetadataWithOptions[]> {
    return groupBy(adders, (adder) => adder.metadata.category);
}
