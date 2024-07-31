export type CategoryInfo = {
	id: string;
	name: string;
	description: string;
};

export type CategoryKeys = 'codeQuality' | 'css' | 'db' | 'additionalFunctionality';
export type CategoryDetails = Record<CategoryKeys, CategoryInfo>;

export type AdderCategories = Record<CategoryKeys, string[]>;

export const categories: CategoryDetails = {
	codeQuality: {
		id: 'codeQuality',
		name: 'Code Quality',
		description: '',
	},
	css: {
		id: 'css',
		name: 'CSS',
		description: 'Can be used to style your components',
	},
	additionalFunctionality: {
		id: 'additionalFunctionality',
		name: 'Additional functionality',
		description: '',
	},
	db: {
		id: 'db',
		name: 'Database',
		description: '',
	},
};
