<script lang="ts">
    import "../app.css";
    import Navbar from "$lib/Navbar.svelte";
    interface Props {
        children?: import('svelte').Snippet;
    }

    let { children }: Props = $props();
</script>

<Navbar></Navbar>

<main>
    {@render children?.()}
</main>

<style>
    main {
        max-width: 1000px;
        margin: 0 auto;
        padding: 20px;
    }
</style>
