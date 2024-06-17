import type { AdderConfig } from "@svelte-add/core/adder/config";
import type { Question } from "@svelte-add/core/adder/options";

export function getAdderList(): string[] {
    // @ts-expect-error The list is assembled during build and injected by rollup.
    // If you don't see all required adders, please restart your dev server.

    return ADDER_LIST as string[];
}

export async function getAdderConfig(name: string) {
    // Either vite / rollup or esbuild are not able to process the shebangs
    // present on the `index.js` file. That's why we directly import the configuration
    // for the website here, as this is the only important part.

    const adder: Promise<{ adder: AdderConfig<Record<string, Question>> }> = await import(`../../adders/${name}/config/adder.ts`);
    const { adder: adderConfig } = await adder;

    return adderConfig;
}
