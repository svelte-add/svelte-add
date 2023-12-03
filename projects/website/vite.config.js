import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { enhancedImages } from "@sveltejs/enhanced-img";
import fs from "fs";

/**
 * Converts font imports to binary font content
 * @param {string[]} ext
 * @returns
 */
function raw_fonts(ext) {
	return {
		name: "vite-plugin-raw-fonts",
		// @ts-ignore-next-line
		transform(_code, id) {
			if (ext.some((e) => id.endsWith(e))) {
				const buffer = fs.readFileSync(id);
				return { code: `export default ${JSON.stringify(buffer)}`, map: null };
			}
		},
	};
}

export default defineConfig({
	plugins: [sveltekit(), raw_fonts([".ttf", ".woff"]), enhancedImages()],
	optimizeDeps: {
		exclude: ["@vercel/og"],
	},
});
