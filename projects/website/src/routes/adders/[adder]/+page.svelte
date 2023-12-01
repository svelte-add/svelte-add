<script>
	import { page } from "$app/stores";
	import OpenGraphAdder from "$lib/opengraph/OpenGraphAdder.svelte";
	import OpenGraphHeadHtml from "$lib/opengraph/OpenGraphHeadHtml.svelte";

	export let data;
</script>

<svelte:head>
	<OpenGraphHeadHtml pageTitle="{data.adderInfo.name} - svelte add" pageDescription="Add {data.adderInfo.name} to your svelte project" ogBaseUrl="/adders/{$page.params.adder}"></OpenGraphHeadHtml>
</svelte:head>

<div>
	<OpenGraphAdder spanText={data.adderInfo.name + " " + data.adderInfo.emoji} />
	<!-- Used only to prerender the OG routes. Not used by the application  -->
	<!-- <img style="display: none" src="{$page.params.adder}/og.png" alt="OG" /> -->
	<h1 class="text-center">
		{data.adderInfo.name}
		{data.adderInfo.emoji}
	</h1>
	<div class="box">
		<h2 class="text-center">Benefits</h2>
		<ul>
			{#each data.adderInfo.usageMarkdown as value}
				<li>
					{@html value}
				</li>
			{/each}
		</ul>
	</div>
	{#if Object.keys(data.adderInfo.options).length > 0}
		<div class="box">
			<h2 class="text-center">Adder options</h2>
			<ul>
				{#each Object.entries(data.adderInfo.options) as [key, value]}
					<li>
						<code>{key}</code>
						{@html value.descriptionMarkdown}
					</li>
				{/each}
			</ul>
		</div>
	{/if}
	<div class="box">
		<h2 class="text-center">Installation</h2>
		tbd
	</div>
</div>
