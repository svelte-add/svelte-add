import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { html as toReactNode } from "satori-html";

// we use a Vite plugin to turn this import into the result of fs.readFileSync during build
import sourceSerifPro from "@fontsource/overpass/files/overpass-latin-400-normal.woff";
import sourceSerifPro2 from "@fontsource/overpass/files/overpass-latin-700-normal.woff";

/**
 * Converts a svelte component to a png
 * @param {any} component
 * @param {object} props
 * @param {number} height
 * @param {number} width
 * @returns
 */
export async function componentToPng(component, props, height, width) {
	const result = component.render(props);
	const markup = toReactNode(`${result.html}<style>${result.css.code}</style>`);
	// @ts-ignore-next-line
	const svg = await satori(markup, {
		fonts: [
			{
				name: "Overpass",
				data: Buffer.from(sourceSerifPro),
				style: "normal",
			},
			{
				name: "Overpass Bold",
				data: Buffer.from(sourceSerifPro2),
				weight: 700,
				style: "normal",
			},
		],
		height: +height,
		width: +width,
		loadAdditionalAsset: async (code, segment) => {
			if (code === "emoji") {
				// if segment is an emoji
				let emoji_code = [...segment]
					// @ts-ignore-next-line
					.map((e) => e.codePointAt(0).toString(16))
					.join(`-`)
					.toUpperCase();
				const new_url = `https://emojiapi.dev/api/v1/${emoji_code}.svg`;
				const response = await fetch(new_url);
				const data = await response.text();
				return `data:image/svg+xml;base64,${btoa(data)}`;
			}

			// if segment is normal text
			return "";
		},
	});

	const resvg = new Resvg(svg, {
		fitTo: {
			mode: "width",
			value: +width,
		},
	});

	const png = resvg.render();

	return new Response(png.asPng(), {
		headers: {
			"content-type": "image/png",
		},
	});
}
