import { defineAdderOptions } from '@svelte-add/core';

export const options = defineAdderOptions({
	database: {
		question: 'Which database would you like to use?',
		type: 'select',
		default: 'sqlite',
		options: [
			{ value: 'postgresql', label: 'PostgreSQL' },
			{ value: 'mysql', label: 'MySQL' },
			{ value: 'sqlite', label: 'SQLite' },
		],
	},
	postgresql: {
		question: 'Which PostgreSQL client would you like to use?',
		type: 'select',
		default: undefined,
		options: [
			{ value: 'postgres.js', label: 'Postgres.JS', hint: 'recommended for most users' },
			{ value: 'neon', label: 'Neon', hint: 'popular hosted platform' },
		],
		condition: ({ database }) => database === 'postgresql',
	},
	mysql: {
		question: 'Which MySQL client would you like to use?',
		type: 'select',
		default: undefined,
		options: [
			{ value: 'mysql2', label: 'mysql2', hint: 'recommended for most users' },
			{ value: 'planetscale', label: 'PlanetScale', hint: 'popular hosted platform' },
		],
		condition: ({ database }) => database === 'mysql',
	},
	sqlite: {
		question: 'Which SQLite client would you like to use?',
		type: 'select',
		default: undefined,
		options: [
			{
				value: 'better-sqlite3',
				label: 'better-sqlite3',
				hint: 'for traditional Node environments',
			},
			{ value: 'libsql', label: 'libSQL', hint: 'for serverless environments' },
			{ value: 'turso', label: 'Turso', hint: 'popular hosted platform' },
		],
		condition: ({ database }) => database === 'sqlite',
	},
	docker: {
		question: 'Do you want to run the database locally with docker-compose?',
		default: false,
		type: 'boolean',
		condition: ({ database, mysql, postgresql }) =>
			(database === 'mysql' && mysql === 'mysql2') ||
			(database === 'postgresql' && postgresql === 'postgres.js'),
	},
});
