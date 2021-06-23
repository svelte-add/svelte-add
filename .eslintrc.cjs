module.exports = {
	root: true,
	extends: ["eslint:recommended", "prettier"],
	parserOptions: {
		sourceType: "module",
	},
	env: {
		es2020: true,
		node: true,
	},
	plugins: ["only-warn"],
};
