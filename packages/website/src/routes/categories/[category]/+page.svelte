<script lang="ts">
    import Box from "$lib/Box.svelte";
    import AdderCategoryList from "$lib/AdderCategoryList.svelte";
    import Configurator from "$lib/Configurator.svelte";
    import Seo from "$lib/Seo.svelte";
    import type { AdderMetadataWithOptions } from "$lib/adder.js";
    import type { PageData } from "./$types.js";

    export let data: PageData;

    const adderCategories = data.adderCategories;
    const category = data.category;
    const availableCliOptions = data.availableCliOptions;

    let selectedAdders: AdderMetadataWithOptions[] = [];
</script>

<Seo title={category.name} description="Add {category.name} to your svelte project" keywords={data.keywords} />

<AdderCategoryList {adderCategories} bind:selectedAdders />

<Box>
    <Configurator adders={selectedAdders} {availableCliOptions} />
</Box>
