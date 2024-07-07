<script lang="ts">
    import "../app.css";
    import Navbar from "$lib/Navbar.svelte";
</script>

<Navbar></Navbar>

<main>
    <slot />
</main>

<style>
    main {
        max-width: 1000px;
        margin: 0 auto;
        padding: 20px;
    }
</style>
