import { getAdderConfig, getAdderList } from "svelte-add/website";
import { writeFile } from "fs/promises";
import { availableCliOptions } from "@svelte-add/core/internal";

const domain = "https://svelte-add.com";
const codeTagStart = "```sh";
const codeTagEnd = "```";

export async function generateAdderReadmes() {
    const adderList = await getAdderList();

    for (const adderName of adderList) {
        const adderConfig = await getAdderConfig(adderName);

        const readmeContent = generateReadme(adderConfig);
        await writeFile(`./adders/${adderConfig.metadata.id}/README.md`, readmeContent);
    }
}

/**
 * Generates the contents of the readme for a given adder
 * @param {import("@svelte-add/core/adder/config").AdderConfig<Record<string, import("@svelte-add/core/adder/options").Question>>} adder
 */
export function generateReadme(adder) {
    const metadata = adder.metadata;
    const adderNpx = `npx ${metadata.package}@latest`;

    return `
<p align="center">
    <img src="${domain}/adder/${metadata.id}/logo.svg" height="50" />
</p>

# ${metadata.name}

> This is a adder for [svelte-add](${domain}) and is used to add ${metadata.name} to your svelte/kit project.

You can find all options for this adder on [this site](${domain}/adder/${metadata.id}). We will only provide a short breakdown of the adder features here.

Basic usage
${codeTagStart}
${adderNpx}
${codeTagEnd}

In case you already have a directory in mind, you can use this:
${codeTagStart}
${adderNpx} --path ./your-project
${codeTagEnd}

${generateOptions(adder, adderNpx)}

${generateCommonOptions(adder, adderNpx)}
`;
}

/**
 * @param {import("@svelte-add/core/adder/config").AdderConfig<Record<string, import("@svelte-add/core/adder/options").Question>>} adder
 * @param {string} adderNpx
 */
function generateOptions(adder, adderNpx) {
    if (!adder.options) return;
    const optionKeys = Object.keys(adder.options);
    if (optionKeys.length == 0) return;

    let markdown = `
## Available options (adder-specific)

    `;

    const options = Object.entries(adder.options);
    for (const [key, value] of options) {
        markdown += `\n- \`${key}\` (default: ${value.default}) - ${value.question}`;
    }

    const [firstOptionKey, firstOptionValue] = options[0];

    markdown += `\n\n
Option syntax
${codeTagStart}
${adderNpx} --key value
${codeTagEnd}

Specific example
${codeTagStart}
${adderNpx} --${firstOptionKey} ${firstOptionValue.default}
${codeTagEnd}

You can combine as many options as you want. The usage of options is optional. If you don't specify an option value via the command line, the CLI will ask you the questions interactively.
`;

    return markdown;
}

/**
 * @param {import("@svelte-add/core/adder/config").AdderConfig<Record<string, import("@svelte-add/core/adder/options").Question>>} adder
 * @param {string} adderNpx
 */
function generateCommonOptions(adder, adderNpx) {
    if (!availableCliOptions) return;
    const optionKeys = Object.keys(availableCliOptions);
    if (optionKeys.length == 0) return;

    let markdown = `
## Available options (common)

    `;

    const options = Object.values(availableCliOptions);
    for (const value of options) {
        markdown += `\n- \`${value.cliArg}\` (default: ${value.default}) - ${value.description}`;
    }

    const firstOptionValue = options[0];

    markdown += `\n\n
Option syntax
${codeTagStart}
${adderNpx} --key value
${codeTagEnd}

Specific example
${codeTagStart}
${adderNpx} --${firstOptionValue.cliArg} ${firstOptionValue.default}
${codeTagEnd}

You can combine as many options as you want. The usage of options is optional. If you don't specify an option value via the command line, the CLI will ask you the questions interactively.
`;

    return markdown;
}
