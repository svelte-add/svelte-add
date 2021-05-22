/** @type {import("../..").Heuristic[]} */
export const heuristics = [
	{
		description: "`tailwindcss` is installed",
		async detector({ environment }) {
			return "tailwindcss" in environment.dependencies || "tailwindcss" in environment.devDependencies;
		},
	},
	{
		description: "`postcss.config.cjs` has `tailwindcss` as a plugin",
		async detector({ readFile }) {
			const { text } = await readFile({ path: "/postcss.config.cjs" });
			return text.includes("tailwindcss");
		},
	},
];
