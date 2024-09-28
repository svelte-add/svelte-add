<script>
    /** @type {{children?: import('svelte').Snippet}} */
    let { children } = $props();
</script>

<div class="box">
    {@render children?.()}
</div>

<style>
    .box {
        margin: 1rem 0;
    }
</style>
