import { getAdderConfig } from "@svelte-add/adders";
import { adderCategories, categories, type CategoryInfo, type CategoryKeys } from "@svelte-add/config";
import type { Question } from "../../../core/adder/options.js";
import type { AdderConfig, AdderConfigMetadata } from "../../../core/adder/config.js";

export type AdderMetadataWithOptions = {
    metadata: AdderConfigMetadata;
    options: Question | null;
};

export async function getAdderInfos(category?: string) {
    const categoryKey = category as CategoryKeys | undefined;
    let filteredCategoryKeys: CategoryKeys[];

    if (categoryKey) {
        filteredCategoryKeys = [categoryKey];
    } else {
        filteredCategoryKeys = Object.keys(categories) as CategoryKeys[];
    }

    const categoryAdders: Map<CategoryInfo, AdderMetadataWithOptions[]> = new Map();
    for (const categoryId of filteredCategoryKeys) {
        const adders: AdderMetadataWithOptions[] = [];
        categoryAdders.set(categories[categoryId], adders);

        for (const adderId of adderCategories[categoryId]) {
            const config = await getAdderDetails(adderId);
            adders.push(config);
        }
    }

    return categoryAdders;
}

// serializes the functions that evaluate a question's conditions
function serializeConditions(adder: AdderConfig<Record<string, Question>>) {
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
