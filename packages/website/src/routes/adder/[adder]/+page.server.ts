import { getAdderDetails } from "$lib/adder.js";
import { availableCliOptions } from "@svelte-add/core/internal";

export async function load({ params }) {
    const config = await getAdderDetails(params.adder);

    return {
        adder: config,
        availableCliOptions,
    };
}
