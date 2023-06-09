import { getPublicAdderListInfos } from "svelte-add";
import { test } from "uvu";

async function executeTests() {
	test("get public adders list infos (returns at least on element)", async () => {
		const publicAdderListInfos = await getPublicAdderListInfos({
			kitProject: true,
		});

		if (publicAdderListInfos.length <= 0) {
			throw Error("public adder list returned 0 elements.");
		}
	});

	test.run();
}

await executeTests();
