export type CategoryInfo = {
	id: string;
	name: string;
	description: string;
};

export type CategoryKeys = 'codeQuality' | 'css' | 'db' | 'markdown' | 'tools' | 'testing';
export type CategoryDetails = Record<CategoryKeys, CategoryInfo>;

export type AdderCategories = Record<CategoryKeys, string[]>;

export const categories: CategoryDetails = {
	codeQuality: {
		id: 'codeQuality',
		name: 'Code Quality',
		description: '',
	},
	testing: {
		id: 'testing',
		name: 'Testing',
		description: '',
	},
	css: {
		id: 'css',
		name: 'CSS',
		description: 'Can be used to style your components',
	},
	tools: {
		id: 'tools',
		name: 'Tools',
		description: 'Different tools',
	},
	db: {
		id: 'db',
		name: 'Database',
		description: '',
	},
	markdown: {
		id: 'markdown',
		name: 'Markdown',
		description: '',
	},
};
