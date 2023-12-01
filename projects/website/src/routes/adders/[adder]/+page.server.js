import { getAdderInfo } from "svelte-add";
import { compile } from "mdsvex";

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	/** @type {import("svelte-add").AdderInfo} */
	const adderInfo = JSON.parse(JSON.stringify(await getAdderInfo({ adder: params.adder })));

	if (adderInfo.usageMarkdown) {
		for (let i = 0; i < adderInfo.usageMarkdown.length; i++) {
			const element = adderInfo.usageMarkdown[i];
			const htmlResult = (await compile(element))?.code;

			if (htmlResult) adderInfo.usageMarkdown[i] = htmlResult;
		}
	}

	if (adderInfo.options) {
		for (const [_, value] of Object.entries(adderInfo.options)) {
			const htmlResult = (await compile(value.descriptionMarkdown))?.code;

			if (htmlResult) value.descriptionMarkdown = htmlResult;
		}
	}

	return {
		adderInfo: adderInfo,
	};
}
