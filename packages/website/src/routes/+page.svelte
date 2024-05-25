<script>
    import AdderCategoryList from "$lib/AdderCategoryList.svelte";
    import Configurator from "$lib/Configurator.svelte";
    import Seo from "$lib/Seo.svelte";

    export let data;

    const adderCategories = data.adderCategories;
    const availableCliOptions = data.availableCliOptions;

    /** @type {import("$lib/adder.js").AdderMetadataWithOptions[]} */
    let selectedAdders = [];
</script>

<Seo title="Home" description="Add tools to your project" keywords={data.keywords} />

<AdderCategoryList {adderCategories} linkCategories={true} bind:selectedAdders />

<Configurator bind:adders={selectedAdders} {availableCliOptions} />
