<script lang="ts">
    import Box from "./Box.svelte";
    import BoxWrapper from "./BoxWrapper.svelte";
    import AdderImage from "./AdderImage.svelte";
    import SupportedEnvironments from "./SupportedEnvironments.svelte";
    import type { CategoryInfo } from "@svelte-add/config";
    import type { AdderMetadataWithOptions } from "./adder.js";


    interface Props {
        adderCategories?: any;
        selectedAdders?: AdderMetadataWithOptions[];
        linkCategories?: boolean;
    }

    let { adderCategories = new Map<CategoryInfo, AdderMetadataWithOptions[]>(), selectedAdders = $bindable([]), linkCategories = false }: Props = $props();

    let selectedAdderIds: string[] = $state([]);

    /**
     * Selects or deselects a adder given it's id
     */
    function selectOrDeselectAdder(adderId: string) {
        if (selectedAdderIds.includes(adderId)) {
            selectedAdderIds = selectedAdderIds.filter((x) => x != adderId);
        } else {
            selectedAdderIds.push(adderId);
            selectedAdderIds = selectedAdderIds;
        }

        const allAdders: AdderMetadataWithOptions[] = [];
        for (const adders of adderCategories.values()) {
            allAdders.push(...adders);
        }

        selectedAdders = allAdders.filter((x) => selectedAdderIds.includes(x.metadata.id));
    }
</script>

{#each [...adderCategories] as [categoryInfo, adders]}
    <div class="category">
        <h2 class="text-xl">
            {#if linkCategories}
                <a href="/categories/{categoryInfo.id}">{categoryInfo.name}</a>
            {:else}
                {categoryInfo.name}
            {/if}
        </h2>
        <div>{categoryInfo.description}</div>
        <BoxWrapper>
            {#each adders as { metadata }}
                <Box>
                    <div class="adder-item">
                        <a href="/adder/{metadata.id}">
                            <AdderImage id={metadata.id} name={metadata.name} />
                            <div class="test">{metadata.name}</div>
                        </a>

                        <div>
                            {metadata.description}
                        </div>

                        <SupportedEnvironments svelte={metadata.environments.svelte} kit={metadata.environments.kit} />

                        <div class="button-wrapper">
                            <button class="button is-primary" onclick={() => selectOrDeselectAdder(metadata.id)}>
                                {#if !selectedAdderIds.includes(metadata.id)}
                                    +
                                {:else}
                                    -
                                {/if}
                            </button>
                        </div>
                    </div>
                </Box>
            {/each}
        </BoxWrapper>
    </div>
{/each}

<style>
    .category {
        margin-bottom: 2rem;
    }

    .adder-item {
        position: relative;
    }

    .button-wrapper {
        position: absolute;
        top: -1.5rem;
        right: -1.5rem;
        text-align: center;
    }

    .button-wrapper button {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 100%;
        padding-left: 0;
        padding-right: 0;
    }
</style>
