<script>
	import OpenGraphAdder from "$lib/opengraph/OpenGraphAdder.svelte";
	import OpenGraphHeadHtml from "$lib/opengraph/OpenGraphHeadHtml.svelte";

	export let data;
</script>

<head>
	<OpenGraphHeadHtml pageTitle="svelte add" pageDescription="Add anything to your svelte project"></OpenGraphHeadHtml>
</head>

<OpenGraphAdder spanText="Add anything to your svelte project" />

<h2 class="text-center">Available Adders</h2>

<div class="box-parent">
	{#each Object.entries(data.adders) as [key, value]}
		<a href="/adders/{key}"
			><div class="box">
				{value.name}
				<span>{value.emoji}</span>
			</div>
		</a>
	{/each}
</div>

<style>
	.box-parent {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
	}

	.box {
		margin: 0.5rem 0;
	}
</style>
