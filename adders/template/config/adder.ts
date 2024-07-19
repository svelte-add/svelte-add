import { dedent, defineAdderConfig } from "@svelte-add/core";
import { options } from "./options.js";

export const adder = defineAdderConfig({
    metadata: {
        id: "ID",
        name: "NAME",
        description: "DESCRIPTION",
        environments: { svelte: SVELTE, kit: KIT, },
        website: {
            logo: "./YOUR_SVG_HERE.svg",
            keywords: [],
            documentation: "DOCUMENTATION_LINK",
        },
    },
    options,
    integrationType: "INTEGRATION_TYPE",
    packages: [],
    files: [
        {
            name: () => `SOMETHING.txt`,
            contentType: "text",
            content: () => {
                return dedent`
                    # an example of what you can do
                `;
            },
        },
    ],
});
