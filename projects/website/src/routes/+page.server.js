import { getAdderInfo, getPublicAdderListInfos } from "svelte-add";

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	const adderInfos = await getPublicAdderListInfos({
		kitProject: true,
		shouldGatekeep: false,
	});

	/** @type {Record<string, import("svelte-add").AdderInfo>} */
	let response = {};

	for (const adder of adderInfos) {
		/** @type {import("svelte-add").AdderInfo} */
		const adderInfo = JSON.parse(JSON.stringify(await getAdderInfo({ adder: adder.systemName })));

		response[adder.systemName] = adderInfo;
	}

	return {
		adders: response,
	};
}
