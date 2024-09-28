<script lang="ts">
    interface Props {
        id: string;
        name: string;
    }

    let { id, name }: Props = $props();
</script>

<div class="adder-logo-wrapper">
    <img class="adder-logo" src="/adder/{id}/logo.svg" alt="{name} logo" />
</div>

<style>
    .adder-logo-wrapper {
        height: 4rem;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 1rem;
    }

    .adder-logo {
        max-width: 100%;
        max-height: 2rem;
    }
</style>
