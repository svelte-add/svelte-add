import type { AdderCategories } from "../categories";

export const adderCategories: AdderCategories = {
    linters: ["prettier"],
    css: ["tailwindcss", "bulma", "bootstrap"],
    db: ["drizzle"],
    markdown: ["mdsvex"],
    tools: ["storybook", "routify"],
};

export const adderIds = Object.values(adderCategories).flatMap((x) => x);
