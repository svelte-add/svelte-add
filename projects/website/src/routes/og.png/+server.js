import OpenGraphAdder from "$lib/opengraph/OpenGraphAdder.svelte";
import { componentToPng } from "$lib/opengraph/renderImage";

export const prerender = true;

/** @type {import('./$types').RequestHandler} */
export const GET = async () => {
	const width = 960;
	const height = 504;

	return componentToPng(OpenGraphAdder, { spanText: `anything`, width, height, satori: true }, height, width);
};
