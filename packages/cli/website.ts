import { AdderConfig } from "@svelte-add/core/adder/config";
import { Question } from "@svelte-add/core/adder/options";

export function getAdderList(): string[] {
    // @ts-expect-error The list is assembled during build and injected by rollup.
    // If you don't see all required adders, please restart your dev server.
    // eslint-disable-next-line no-undef
    return ADDER_LIST;
}

export async function getAdderConfig(name: string) {
    const config = await executeAdder(name);

    return config;
}

export async function executeAdder(name: string): Promise<AdderConfig<Record<string, Question>>> {
    // Either vite / rollup or esbuild are not able to process the shebangs
    // present on the `index.js` file. That's why we directly import the configuration
    // for the website here, as this is the only important part.
    const adder = await import(`../../adders/${name}/config/adder.js`);
    const { adder: adderConfig } = await adder;

    return adderConfig;
}

export function groupBy<Key, Value>(list: Value[], keyGetter: (input: Value) => Key) {
    const map = new Map<Key, Value[]>();
    list.forEach((item) => {
        const key = keyGetter(item);
        const collection = map.get(key);
        if (!collection) {
            map.set(key, [item]);
        } else {
            collection.push(item);
        }
    });
    return map;
}
