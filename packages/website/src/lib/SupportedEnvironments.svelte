<script lang="ts">
    export let svelte = false;
    export let kit = false;
</script>

<div>
    <span>Environments:</span>
    svelte {svelte ? "✅" : "❌"}
    kit {kit ? "✅" : "❌"}
</div>
