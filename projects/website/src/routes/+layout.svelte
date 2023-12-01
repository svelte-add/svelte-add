<script>
	import Navbar from "$lib/Navbar.svelte";
	import "../app.pcss";
	import "@fontsource/overpass/400.css";
	import "@fontsource/overpass/700.css";
</script>

<Navbar />

<main>
	<slot />
</main>
