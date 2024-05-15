import { getAdderConfig, getAdderList } from "svelte-add/website";
import { readFile, writeFile } from "fs/promises";

const repoUrl = "https://github.com/svelte-add/svelte-add";

export async function updateAdderPackages() {
    const adderList = await getAdderList();

    for (const adderName of adderList) {
        const adderConfig = await getAdderConfig(adderName);

        const filePath = `./adders/${adderConfig.metadata.id}/package.json`;
        const content = await readFile(filePath);
        const data = JSON.parse(content.toString());
        updateAdderPackage(data, adderConfig);
        await writeFile(filePath, JSON.stringify(data, null, 4));
    }
}

/**
 * @param {any} data
 * @param {import("@svelte-add/core/adder/config").AdderConfig<Record<string, import("@svelte-add/core/adder/options").Question>>} adder
 */
function updateAdderPackage(data, adder) {
    data.bugs = `${repoUrl}/issues`;
    data.repository = {};
    data.repository.type = "git";
    data.repository.url = `${repoUrl}/tree/main/adders/${adder.metadata.id}`;
    data.keywords = adder.metadata.website?.keywords;
    data.keywords.push("svelte");
    data.keywords.push("kit");
    data.keywords.push("svelte-kit");
}
