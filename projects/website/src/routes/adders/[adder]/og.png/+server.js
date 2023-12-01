import OpenGraphAdder from "$lib/opengraph/OpenGraphAdder.svelte";
import { componentToPng } from "$lib/opengraph/renderImage";
import { getAdderInfo } from "svelte-add";

export const prerender = true;

/** @type {import('./$types').RequestHandler} */
export const GET = async ({ params }) => {
	const width = 960;
	const height = 504;

	/** @type {import("svelte-add").AdderInfo} */
	const adderInfo = JSON.parse(JSON.stringify(await getAdderInfo({ adder: params.adder })));

	return componentToPng(OpenGraphAdder, { spanText: `${adderInfo.name} ${adderInfo.emoji}`, width, height, satori: true }, height, width);
};
