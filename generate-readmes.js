import { readdir, writeFile } from "fs/promises";
import { getAdderInfo } from "./projects/svelte-add/index.js";

/**
 * @param {object} param0
 * @param {Set<"kit" | "vite">} param0.supportedEnvironments
 * @returns {string}
 */
const supportedEnvironmentsTemplate = ({ supportedEnvironments }) => {
	if (supportedEnvironments.has("vite")) {
		if (supportedEnvironments.has("kit")) {
			return "This adder supports SvelteKit and Vite-powered Svelte apps (all the environments `svelte-add` currently supports).";
		} else {
			return "This adder only supports Vite-powered Svelte apps (but not SvelteKit).";
		}
	} else if (supportedEnvironments.has("kit")) {
		return "This adder only supports SvelteKit.";
	} else {
		return "This adder doesn't support anything???";
	}
};

/**
 * @param {object} param0
 * @param {import("./projects/svelte-add/index.js").AdderOptions<unknown>} param0.options
 * @returns {string}
 */
const optionsTemplate = ({ options }) => {
	const allOptions = Object.entries(options);

	if (allOptions.length === 0) return "This adder doesn't take any options of its own.";

	return allOptions.map(([option, { default: default_, descriptionMarkdown }]) => `- \`${option}\` (default \`${default_}\`): ${descriptionMarkdown}`).join("\n\n");
};

/**
 * @param {object} param0
 * @param {string[]} param0.usageMarkdown
 * @returns {string}
 */
const usageTemplate = ({ usageMarkdown }) => {
	return usageMarkdown.map((usage) => `- ${usage}`).join("\n\n");
};

/**
 * @param {object} param0
 * @param {string} param0.codename
 * @param {string} param0.emoji
 * @param {string} param0.name
 * @param {import("./projects/svelte-add/index.js").AdderOptions<unknown>} param0.options
 * @param {Set<"kit" | "vite">} param0.supportedEnvironments
 * @param {string[]} param0.usageMarkdown
 * @returns
 */
const template = ({ codename, emoji, name, options, supportedEnvironments, usageMarkdown }) =>
	`<h1 align="center">${emoji} Add ${name} to Svelte</h1>

This is an adder for \`svelte-add\`; you should [read its \`README\`](https://github.com/svelte-add/svelte-add#readme) before continuing here.

## ➕ Adding ${name}

This adder's codename is \`${codename}\`, and can be used like so:

\`\`\`sh
npx svelte-add@latest ${codename}
\`\`\`

### 🏞 Supported environments

${supportedEnvironmentsTemplate({ supportedEnvironments })}

### ⚙️ Options

${optionsTemplate({ options })}

## 🛠 Using ${name}

After the adder runs,

${usageTemplate({ usageMarkdown })}
`;

const main = async () => {
	const featuresPath = "./projects/svelte-add/adders";
	const features = await readdir(featuresPath);

	for (const feature of features) {
		const adderInfo = await getAdderInfo({ adder: feature });

		/** @type {import("./projects/svelte-add/index.js").FolderInfo} */
		const folderInfo = {
			allDependencies: {},
			bundler: undefined,
			empty: false,
			kit: false,
			packageType: "module",
		};

		const addable = { vite: false, kit: false };
		for (const bundler of /** @type {"vite"[]} */ (["vite"])) {
			for (const kit of [true, false]) {
				folderInfo.kit = kit;
				folderInfo.bundler = bundler;

				const gatekept = await adderInfo.gatekeep({ folderInfo, async runCommand() {} });
				if ("able" in gatekept) addable[kit ? "kit" : "vite"] = true;
			}
		}
		if (!addable.vite && !addable.kit) continue;

		/** @type {Set<"kit" | "vite">} */
		const supportedEnvironments = new Set();
		if (addable.kit) supportedEnvironments.add("kit");
		if (addable.vite) supportedEnvironments.add("vite");

		const readme = template({
			codename: feature,
			emoji: adderInfo.emoji ?? "⁉️",
			name: adderInfo.name,
			options: adderInfo.options,
			supportedEnvironments,
			usageMarkdown: adderInfo.usageMarkdown ?? [],
		});

		await writeFile(`${featuresPath}/${feature}/README.md`, readme, { encoding: "utf8" });
	}
};

main();
