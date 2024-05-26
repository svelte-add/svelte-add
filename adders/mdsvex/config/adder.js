import { categories, defineAdderConfig, generateAdderInfo } from "@svelte-add/core";
import pkg from "../package.json";
import { options } from "./options";

export const adder = defineAdderConfig({
    metadata: {
        ...generateAdderInfo(pkg),
        name: "mdsvex",
        description: "svelte in markdown",
        category: categories.tools,
        environments: { svelte: true, kit: true },
        website: {
            logo: "./mdsvex.svg",
            keywords: ["mdsvex", "svelte", "markdown"],
            documentation: "https://mdsvex.pngwn.io/docs",
        },
    },
    options,
    integrationType: "inline",
    packages: [{ name: "mdsvex", version: "^0.11.0", dev: true }],
    files: [
        {
            name: () => `svelte.config.js`,
            contentType: "script",
            content: ({ ast, array, object, common, functions, imports, exports }) => {
                imports.addNamed(ast, "mdsvex", { mdsvex: "mdsvex" });

                const { value: exportDefault } = exports.defaultExport(ast, object.createEmpty());

                // preprocess
                let preprocessorArray = object.property(exportDefault, "preprocess", array.createEmpty());
                const isArray = preprocessorArray.type === "ArrayExpression";

                if (!isArray) {
                    const previousElement = preprocessorArray;
                    preprocessorArray = array.createEmpty();
                    array.push(preprocessorArray, previousElement);
                    object.overrideProperty(exportDefault, "preprocess", preprocessorArray);
                }

                const mdsvexCall = functions.call("mdsvex", []);
                array.push(preprocessorArray, mdsvexCall);

                // extensions
                const extensionsArray = object.property(exportDefault, "extensions", array.createEmpty());
                const svelteString = common.createLiteral(".svelte");
                const svxString = common.createLiteral(".svx");
                array.push(extensionsArray, svelteString);
                array.push(extensionsArray, svxString);
            },
        },
    ],
});
