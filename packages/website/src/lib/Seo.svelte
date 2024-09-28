<script lang="ts">
    interface Props {
        title: string;
        description: string;
        keywords?: string[] | undefined;
    }

    let { title, description, keywords = undefined }: Props = $props();
</script>

<svelte:head>
    <title>{title} - svelte add</title>
    <meta name="description" content={description} />

    {#if keywords}
        <meta name="keywords" content={keywords.join(",")} />
    {/if}
</svelte:head>
