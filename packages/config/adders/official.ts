import type { AdderCategories } from '../categories.js';

export const adderCategories: AdderCategories = {
	codeQuality: ['prettier', 'eslint'],
	css: ['tailwindcss', 'bulma', 'bootstrap'],
	db: ['drizzle'],
	tools: ['storybook', 'mdsvex', 'routify'],
};

export const adderIds = Object.values(adderCategories).flatMap((x) => x);
