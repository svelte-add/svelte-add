<script lang="ts">
    import AdderCategoryList from "$lib/AdderCategoryList.svelte";
    import Configurator from "$lib/Configurator.svelte";
    import Seo from "$lib/Seo.svelte";
    import type { AdderMetadataWithOptions } from "$lib/adder.js";
    import type { PageData } from "./$types.js";

    export let data: PageData;

    const adderCategories = data.adderCategories;
    const availableCliOptions = data.availableCliOptions;

    let selectedAdders: AdderMetadataWithOptions[] = [];
</script>

<Seo title="Home" description="Add tools to your project" keywords={data.keywords} />

<AdderCategoryList {adderCategories} linkCategories={true} bind:selectedAdders />

<Configurator bind:adders={selectedAdders} {availableCliOptions} />
