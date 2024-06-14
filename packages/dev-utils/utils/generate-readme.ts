import { getAdderConfig, getAdderList } from "svelte-add/website";
import { writeFile } from "fs/promises";
import { availableCliOptions } from "@svelte-add/core/internal";
import { AdderConfig } from "@svelte-add/core/adder/config";
import { Question } from "@svelte-add/core/adder/options";

const domain = "https://svelte-add.com";
const codeTagStart = "```sh";
const codeTagEnd = "```";

export async function generateAdderReadmes() {
    const adderList = getAdderList();

    for (const adderName of adderList) {
        const adderConfig = await getAdderConfig(adderName);

        const readmeContent = generateReadme(adderConfig);
        await writeFile(`./adders/${adderConfig.metadata.id}/README.md`, readmeContent);
    }
}

export function generateReadme(adder: AdderConfig<Record<string, Question>>) {
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

${generateCommonOptions(adderNpx)}
`;
}

function generateOptions(adder: AdderConfig<Record<string, Question>>, adderNpx: string) {
    const optionKeys = Object.keys(adder.options);
    if (optionKeys.length == 0) return "";

    let markdown = `
## Available options (adder-specific)

    `;

    const options = Object.entries(adder.options);
    for (const [key, value] of options) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const optionDefaultValue = value.default.toString() as string;
        markdown += `\n- \`${key}\` (default: ${optionDefaultValue}) - ${value.question}`;
    }

    const [firstOptionKey, firstOptionValue] = options[0];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const firstOptionDefaultValue = firstOptionValue.default.toString() as string;

    markdown += `\n\n
Option syntax
${codeTagStart}
${adderNpx} --key value
${codeTagEnd}

Specific example
${codeTagStart}
${adderNpx} --${firstOptionKey} ${firstOptionDefaultValue}
${codeTagEnd}

You can combine as many options as you want. The usage of options is optional. If you don't specify an option value via the command line, the CLI will ask you the questions interactively.
`;

    return markdown;
}

function generateCommonOptions(adderNpx: string) {
    const optionKeys = Object.keys(availableCliOptions);
    if (optionKeys.length == 0) return "";

    let markdown = `
## Available options (common)

    `;

    const options = Object.values(availableCliOptions);
    for (const value of options) {
        markdown += `\n- \`${value.cliArg}\` (default: ${value.default.toString()}) - ${value.description}`;
    }

    const pathOptionValue = options.find((option) => option.cliArg === "path");
    if (!pathOptionValue) return "";

    markdown += `\n\n
Option syntax
${codeTagStart}
${adderNpx} --key value
${codeTagEnd}

Specific example
${codeTagStart}
${adderNpx} --${pathOptionValue.cliArg} ${pathOptionValue.default.toString()}
${codeTagEnd}

You can combine as many options as you want. The usage of options is optional. If you don't specify an option value via the command line, the CLI will ask you the questions interactively.
`;

    return markdown;
}
