import { create, type Template } from "template-factory";
import * as util from "template-factory/util";
import fs from "node:fs";
import path from "path";

type State = {
    svelte: boolean;
    kit: boolean;
    description: string;
    docs: string;
};

const main = async () => {
    await create({
        appName: "adders:create",
        version: "1.0.0",
        templates: [
            {
                name: "custom-adder",
                path: util.relative("../adders/template", import.meta.url),
                flag: "custom-adder",
                excludeFiles: ["README.md"],
                state: { svelte: false, kit: false, description: "", docs: "" },
                prompts: [
                    {
                        kind: "text",
                        message: "Description of the adder",
                        validate: (value) => {
                            if (value == "") return "Please enter a description for your adder";
                        },
                        result: {
                            // eslint-disable-next-line @typescript-eslint/require-await
                            run: async (result, { state }) => {
                                state.description = result;
                            },
                        },
                    },
                    {
                        kind: "text",
                        message: "Link to documentation for the adder",
                        validate: (value) => {
                            if (value == "") return "Please include a documentation link for your adder";

                            try {
                                new URL(value);
                            } catch (_) {
                                return "Please enter a valid URL";
                            }
                        },
                        result: {
                            // eslint-disable-next-line @typescript-eslint/require-await
                            run: async (result, { state }) => {
                                state.docs = result;
                            },
                        },
                    },
                    {
                        kind: "confirm",
                        message: "Is this an adder for Svelte?",
                        initialValue: true,
                        yes: {
                            // eslint-disable-next-line @typescript-eslint/require-await
                            run: async ({ state }) => {
                                state.svelte = true;

                                return [
                                    {
                                        kind: "confirm",
                                        message: "Is this an adder for SvelteKit?",
                                        yes: {
                                            // eslint-disable-next-line @typescript-eslint/require-await
                                            run: async ({ state }) => {
                                                state.kit = true;
                                            },
                                        },
                                    },
                                ];
                            },
                        },
                    },
                    {
                        kind: "select",
                        message: "What type of integration is this?",
                        initialValue: "inline",
                        options: [
                            {
                                name: "external",
                            },
                            {
                                name: "inline",
                            },
                        ],
                        result: {
                            // eslint-disable-next-line @typescript-eslint/require-await
                            run: async (result, { state, projectName, dir }) => {
                                const adderPath = path.join(dir, "config/adder.ts");

                                let adderTsContent = fs.readFileSync(adderPath).toString();

                                adderTsContent = adderTsContent.replace("ID", projectName);
                                adderTsContent = adderTsContent.replace("NAME", projectName);
                                adderTsContent = adderTsContent.replace("DESCRIPTION", state.description);
                                adderTsContent = adderTsContent.replace("DOCUMENTATION_LINK", state.docs);
                                adderTsContent = adderTsContent.replace("INTEGRATION_TYPE", result);
                                adderTsContent = adderTsContent.replace("YOUR_SVG_HERE", projectName);
                                adderTsContent = adderTsContent.replace("SVELTE", state.svelte.toString());
                                adderTsContent = adderTsContent.replace("KIT", state.kit.toString());

                                fs.renameSync(path.join(dir, "YOUR_SVG_HERE.svg"), path.join(dir, `${projectName}.svg`));

                                fs.writeFileSync(adderPath, adderTsContent);
                            },
                        },
                    },
                ],
            } satisfies Template<State>,
        ],
    });
};

void main();
