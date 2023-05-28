import { AtRule, Comment, Declaration } from "postcss";
import { extension } from "../scss/stuff.js";

/** @type {import("../..").AdderRun<import("./__info.js").Options>} */
export const run = async ({ install, updateCss }) => {
	await updateCss({
		path: `/src/variables.${extension}`,
		async style({ postcss }) {
			postcss.append(
				new Comment({
					text: "https://github.com/picocss/pico/issues/201",
				})
			);
			postcss.append(
				new Declaration({
					prop: "$semantic-root-element",
					value: `"body div:first-child"`,
				})
			);

			return {
				postcss,
			};
		},
	});

	await updateCss({
		path: `/src/app.${extension}`,
		async style({ postcss }) {
			const importHint = new Comment({
				text: "To import only what you need from Pico [check the documentaion](https://picocss.com/docs/customization.html)",
			});
			postcss.prepend(importHint);

			const importAtRule = new AtRule({
				name: "import",
				params: `"@picocss/pico/scss/pico"`,
			});

			postcss.prepend(importAtRule);

			return {
				postcss,
			};
		},
	});

	await install({ package: "@picocss/pico" });
};
