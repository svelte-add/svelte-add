import type { AdderConfig } from "@svelte-add/core/adder/config";
import type { Question } from "@svelte-add/core/adder/options";
import { adderIds } from "@svelte-add/config";

export function getAdderList(): string[] {
    return adderIds;
}

export async function getAdderConfig(name: string) {
    // Either vite / rollup or esbuild are not able to process the shebangs
    // present on the `index.js` file. That's why we directly import the configuration
    // for the website here, as this is the only important part.

    const adder: Promise<{ adder: AdderConfig<Record<string, Question>> }> = await import(`../../adders/${name}/config/adder.ts`);
    const { adder: adderConfig } = await adder;

    return adderConfig;
}
