import OpenGraphAdder from "$lib/opengraph/OpenGraphAdder.svelte";
import { componentToPng } from "$lib/opengraph/renderImage";
import { getAdderInfo } from "svelte-add";

export const prerender = true;

/** @type {import('./$types').RequestHandler} */
export const GET = async ({ params }) => {
	const width = 960;
	const height = 504;

	return componentToPng(OpenGraphAdder, { spanText: `anything`, width, height, satori: true }, height, width);
};
