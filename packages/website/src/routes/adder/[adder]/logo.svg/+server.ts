import path from "node:path";
import { readFile } from "node:fs/promises";
import { getAdderConfig } from "@svelte-add/adders";
import type { RequestHandler } from "./$types.js";

export const prerender = true;

export const GET: RequestHandler = async ({ params }) => {
    const config = await getAdderConfig(params.adder);
    const data = await readFile(path.join(`../../adders/${config.metadata.id}`, config.metadata.website?.logo));

    return new Response(data, {
        headers: {
            "content-type": "image/svg+xml",
        },
    });
};
