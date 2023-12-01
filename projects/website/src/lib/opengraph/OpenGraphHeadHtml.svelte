<script>
	export let pageTitle = "";
	export let pageDescription = "";
	export let ogBaseUrl = "";
</script>

<!-- HTML Meta Tags -->
<title>{pageTitle}</title>
<meta name="description" content={pageTitle} />

<!-- Facebook Meta Tags -->
<meta property="og:url" content="{ogBaseUrl}/og.png" />
<meta property="og:type" content="website" />
<meta property="og:title" content={pageTitle} />
<meta property="og:description" content={pageDescription} />
<meta property="og:image" content="{ogBaseUrl}/og.png" />

<!-- Twitter Meta Tags -->
<meta name="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content="{ogBaseUrl}/og.png" />
<meta name="twitter:title" content={pageTitle} />
<meta name="twitter:description" content={pageDescription} />
<meta name="twitter:image" content="{ogBaseUrl}/og.png" />
