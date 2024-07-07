<script lang="ts">
    export let title: string;
    export let description: string;
    export let keywords: string[] | undefined = undefined;
</script>

<svelte:head>
    <title>{title} - svelte add</title>
    <meta name="description" content={description} />

    {#if keywords}
        <meta name="keywords" content={keywords.join(",")} />
    {/if}
</svelte:head>
