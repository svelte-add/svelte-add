import { getAdderDetails } from "$lib/adder.js";

export async function load({ params }) {
    const config = await getAdderDetails(params.adder);

    return {
        adder: config,
    };
}
