import { getAdderConfig, getAdderList } from "svelte-add/website";
import { readFile, writeFile } from "fs/promises";
import { Question } from "@svelte-add/core/adder/options";
import { AdderConfig } from "@svelte-add/core/adder/config";
import { Package } from "@svelte-add/core/utils/common";

const repoUrl = "https://github.com/svelte-add/svelte-add";

export async function updateAdderPackages() {
    const adderList = getAdderList();

    for (const adderName of adderList) {
        const adderConfig = await getAdderConfig(adderName);

        const filePath = `./adders/${adderConfig.metadata.id}/package.json`;
        const content = await readFile(filePath);
        const data: Package = JSON.parse(content.toString()) as Package;
        updateAdderPackage(data, adderConfig);
        await writeFile(filePath, JSON.stringify(data, null, 4));
    }
}

function updateAdderPackage(data: Package, adder: AdderConfig<Record<string, Question>>) {
    data.bugs = `${repoUrl}/issues`;
    data.repository = {
        type: "git",
        url: `${repoUrl}/tree/main/adders/${adder.metadata.id}`,
    };
    data.repository.type = "git";
    data.keywords = adder.metadata.website?.keywords ?? [];
    data.keywords.push("svelte");
    data.keywords.push("kit");
    data.keywords.push("svelte-kit");
}
