import type { AdderCategories } from '../categories.js';

export const adderCategories: AdderCategories = {
	codeQuality: ['prettier', 'eslint'],
	css: ['tailwindcss', 'bulma', 'bootstrap'],
	db: ['drizzle'],
	tools: ['storybook', 'routify', 'mdsvex'],
};

export const adderIds = Object.values(adderCategories).flatMap((x) => x);
