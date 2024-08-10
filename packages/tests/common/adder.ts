import { getAdderDetails } from '@svelte-add/adders';
import { adderIds } from '@svelte-add/config';
import type { AdderWithoutExplicitArgs } from '@svelte-add/core/adder/config';
import { remoteControl } from '@svelte-add/core/internal';

export async function getAllAdders() {
	const adders: AdderWithoutExplicitArgs[] = [];

	for (const adderName of adderIds) {
		adders.push(await getAdder(adderName));
	}

	return adders;
}

async function getAdder(adderName: string) {
	remoteControl.enable();

	const adder = await getAdderDetails(adderName);

	remoteControl.disable();

	return adder;
}
