<script>
    import Box from "$lib/Box.svelte";
    import AdderCategoryList from "$lib/AdderCategoryList.svelte";
    import Configurator from "$lib/Configurator.svelte";
    import Seo from "$lib/Seo.svelte";

    export let data;

    const adderCategories = data.adderCategories;
    const category = data.category;
    const availableCliOptions = data.availableCliOptions;

    /** @type {import("$lib/adder.js").AdderMetadataWithOptions[]} */
    let selectedAdders = [];
</script>

<Seo title={category.name} description="Add {category.name} to your svelte project" keywords={data.keywords} />

<AdderCategoryList {adderCategories} bind:selectedAdders />

<Box>
    <Configurator adders={selectedAdders} {availableCliOptions} />
</Box>
