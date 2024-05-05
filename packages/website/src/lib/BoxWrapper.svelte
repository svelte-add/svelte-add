<div class="box-wrapper">
    <slot />
</div>

<style>
    .box-wrapper {
        display: flex;
        gap: 1rem;
        margin: 1rem 0;
        justify-content: space-between;
        flex-wrap: wrap;
    }

    .box-wrapper > :global(div) {
        flex: 1 0 calc(33.33% - 1rem);
        margin: 0;
        max-width: calc(50% - 0.5rem);
    }
</style>
