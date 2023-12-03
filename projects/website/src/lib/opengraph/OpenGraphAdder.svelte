<script>
	import logoSvg from "$lib/svelte-add_logo.svg?raw";

	export let spanText = "";
	export let satori = false;
</script>

<div class:satori class="wrapper">
	<div class="logo">
		{@html logoSvg}
	</div>
	<div class="text">
		<div class="font-weight">Add {spanText}</div>
		<div>to your svelte project</div>
	</div>
</div>

<style>
	div {
		font-family: "Overpass";
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	div.wrapper {
		color: white;
	}
	div.wrapper.satori {
		color: black;
	}

	.wrapper {
		margin: 5px;
		font-size: 50px;
		height: 100%;
	}

	.text {
		width: 60%;
		flex-direction: column;
	}

	.logo {
		height: 30%;
		width: 30%;
		margin: 20px;
	}
	.satori .logo {
		height: 30vw;
		width: 30vw;
	}

	.font-weight {
		font-family: "Overpass Bold", Overpass;
		font-weight: 700;
	}

	.satori {
		background-color: white;
	}
</style>
