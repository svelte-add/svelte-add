<script lang="ts">
    interface Props {
        command: string;
    }

    let { command }: Props = $props();

    function copy() {
        navigator.clipboard.writeText(command);
    }
</script>

<div class="wrapper">
    <div>
        {command}
    </div>
    <div>
        <button class="button is-primary" onclick={copy}>Copy</button>
    </div>
</div>

<style>
    .wrapper {
        background-color: var(--dark-grey);
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        border-radius: 0.5rem;
        margin: 1rem 0;
    }
</style>
