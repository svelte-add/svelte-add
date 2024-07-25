import type { AdderConfig, AdderWithoutExplicitArgs } from '@svelte-add/core/adder/config';
import type { Question } from '@svelte-add/core/adder/options';

export async function getAdderDetails(name: string) {
	const adder: { default: AdderWithoutExplicitArgs } = await import(`./${name}/index.ts`);

	return adder.default;
}

export async function getAdderConfig(name: string) {
	// Mainly used by the website
	// Either vite / rollup or esbuild are not able to process the shebangs
	// present on the `index.js` file. That's why we directly import the configuration
	// for the website here, as this is the only important part.

	const adder: Promise<{ adder: AdderConfig<Record<string, Question>> }> = await import(
		`./${name}/config/adder.ts`
	);
	const { adder: adderConfig } = await adder;

	return adderConfig;
}
