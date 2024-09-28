<script lang="ts">
    interface Props {
        svelte?: boolean;
        kit?: boolean;
    }

    let { svelte = false, kit = false }: Props = $props();
</script>

<div>
    <span>Environments:</span>
    svelte {svelte ? "✅" : "❌"}
    kit {kit ? "✅" : "❌"}
</div>
