<script>
    export let /** @type {string} */ title;
    export let /** @type {string} */ description;
    export let /** @type {string[] | undefined} */ keywords = undefined;
</script>

<svelte:head>
    <title>{title} - svelte add</title>
    <meta name="description" content={description} />

    {#if keywords}
        <meta name="keywords" content={keywords.join(",")} />
    {/if}
</svelte:head>
