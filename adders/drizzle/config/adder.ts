import { defineAdderConfig, dedent, type TextFileEditorArgs } from '@svelte-add/core';
import { options as availableOptions } from './options';

const PORTS = {
	mysql: '3306',
	postgresql: '5432',
	sqlite: '',
} as const;

export const adder = defineAdderConfig({
	metadata: {
		id: 'drizzle',
		name: 'Drizzle',
		description: 'Headless ORM for NodeJS, TypeScript and JavaScript',
		environments: { svelte: false, kit: true },
		website: {
			logo: './drizzle.svg',
			keywords: ['drizzle', 'drizzle-orm', 'drizzle-kit', 'database', 'orm'],
			documentation: 'https://orm.drizzle.team/docs/overview',
		},
	},
	options: availableOptions,
	integrationType: 'inline',
	packages: [
		{ name: 'drizzle-orm', version: '^0.31.2', dev: false },
		{ name: 'drizzle-kit', version: '^0.22.0', dev: true },
		// MySQL
		{
			name: 'mysql2',
			version: '^3.9.8',
			dev: false,
			condition: ({ options }) => options.mysql === 'mysql2',
		},
		{
			name: '@planetscale/database',
			version: '^1.18.0',
			dev: false,
			condition: ({ options }) => options.mysql === 'planetscale',
		},
		// PostgreSQL
		{
			name: '@neondatabase/serverless',
			version: '^0.9.3',
			dev: false,
			condition: ({ options }) => options.postgresql === 'neon',
		},
		{
			name: 'postgres',
			version: '^3.4.4',
			dev: false,
			condition: ({ options }) => options.postgresql === 'postgres.js',
		},
		// SQLite
		{
			name: 'better-sqlite3',
			version: '^10.0.0',
			dev: false,
			condition: ({ options }) => options.sqlite === 'better-sqlite3',
		},
		{
			name: '@types/better-sqlite3',
			version: '^7.6.10',
			dev: true,
			condition: ({ options }) => options.sqlite === 'better-sqlite3',
		},
		{
			name: '@libsql/client',
			version: '^0.6.1',
			dev: false,
			condition: ({ options }) => options.sqlite === 'libsql' || options.sqlite === 'turso',
		},
	],
	files: [
		{
			name: () => `.env`,
			contentType: 'text',
			content: generateEnvFileContent,
		},
		{
			name: () => `.env.example`,
			contentType: 'text',
			content: generateEnvFileContent,
		},
		{
			name: () => `docker-compose.yml`,
			contentType: 'text',
			condition: ({ options }) =>
				options.docker && (options.mysql === 'mysql2' || options.postgresql === 'postgres.js'),
			content: ({ content, options }) => {
				// if the file already exists, don't modify it
				// (in the future, we could add some tooling for modifying yaml)
				if (content.length > 0) return content;

				const imageName = options.database === 'mysql' ? 'mysql' : 'postgres';
				const port = PORTS[options.database];

				const USER = 'root';
				const PASSWORD = 'mysecretpassword';
				const DB_NAME = 'local';

				let dbSpecificContent = '';
				if (options.mysql === 'mysql2') {
					dbSpecificContent = `
                      MYSQL_ROOT_PASSWORD: ${PASSWORD}
                      MYSQL_DATABASE: ${DB_NAME}
                `;
				}
				if (options.postgresql === 'postgres.js') {
					dbSpecificContent = `
                      POSTGRES_USER: ${USER}
                      POSTGRES_PASSWORD: ${PASSWORD}
                      POSTGRES_DB: ${DB_NAME}
                `;
				}

				content = dedent`
                services:
                  db:
                    image: ${imageName}
                    restart: always
                    ports:
                      - ${port}:${port}
                    environment: ${dbSpecificContent}
                `;

				return content;
			},
		},
		{
			name: () => `package.json`,
			contentType: 'json',
			content: ({ data, options }) => {
				data.scripts ??= {};
				const scripts: Record<string, string> = data.scripts;
				if (options.docker) scripts['db:start'] ??= 'docker compose up';
				scripts['db:push'] ??= 'drizzle-kit push';
				scripts['db:migrate'] ??= 'drizzle-kit migrate';
				scripts['db:studio'] ??= 'drizzle-kit studio';
			},
		},
		{
			// Adds the db file to the gitignore if an ignore is present
			name: () => `.gitignore`,
			contentType: 'text',
			condition: ({ options }) => options.database === 'sqlite',
			content: ({ content }) => {
				if (content.length === 0) return content;

				if (!content.includes('\n*.db')) content = content.trimEnd() + '\n*.db';
				return content;
			},
		},
		{
			name: ({ typescript }) => `drizzle.config.${typescript.installed ? 'ts' : 'js'}`,
			contentType: 'script',
			content: ({ options, ast, common, exports, typescript, imports, object }) => {
				imports.addNamed(ast, 'drizzle-kit', { defineConfig: 'defineConfig' });

				const envCheckStatement = common.statementFromString(
					`if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');`,
				);
				common.addStatement(ast, envCheckStatement);

				const fallback = common.expressionFromString('defineConfig({})');
				const { value: exportDefault } = exports.defaultExport(ast, fallback);
				if (exportDefault.type !== 'CallExpression') return;

				const objExpression = exportDefault.arguments?.[0];
				if (!objExpression || objExpression.type !== 'ObjectExpression') return;

				const driver = options.sqlite === 'turso' ? common.createLiteral('turso') : undefined;
				const authToken =
					options.sqlite === 'turso'
						? common.expressionFromString('process.env.DATABASE_AUTH_TOKEN')
						: undefined;

				object.properties(objExpression, {
					schema: common.createLiteral(
						`./src/lib/server/db/schema.${typescript.installed ? 'ts' : 'js'}`,
					),
					dbCredentials: object.create({
						url: common.expressionFromString('process.env.DATABASE_URL'),
						authToken: authToken,
					}),
					verbose: { type: 'BooleanLiteral', value: true },
					strict: { type: 'BooleanLiteral', value: true },
					driver,
				});

				object.overrideProperties(objExpression, {
					dialect: common.createLiteral(options.database),
				});

				// The `driver` property is only required for _some_ sqlite DBs.
				// We'll need to remove it if it's anything but sqlite
				if (options.database !== 'sqlite') object.removeProperty(objExpression, 'driver');
			},
		},
		{
			name: ({ kit, typescript }) =>
				`${kit.libDirectory}/server/db/schema.${typescript.installed ? 'ts' : 'js'}`,
			contentType: 'script',
			content: ({ ast, exports, imports, options, common, variables }) => {
				let userSchemaExpression;
				if (options.database === 'sqlite') {
					imports.addNamed(ast, 'drizzle-orm/sqlite-core', {
						sqliteTable: 'sqliteTable',
						text: 'text',
						integer: 'integer',
					});

					userSchemaExpression = common.expressionFromString(`sqliteTable('user', {
                        id: integer('id').primaryKey(),
                        name: text('name').notNull(),
                        age: integer('age')
                    })`);
				}
				if (options.database === 'mysql') {
					imports.addNamed(ast, 'drizzle-orm/mysql-core', {
						mysqlTable: 'mysqlTable',
						serial: 'serial',
						text: 'text',
						int: 'int',
					});

					userSchemaExpression = common.expressionFromString(`mysqlTable('user', {
                        id: serial("id").primaryKey(),
                        name: text('name').notNull(),
                        age: int('age'),
                    })`);
				}
				if (options.database === 'postgresql') {
					imports.addNamed(ast, 'drizzle-orm/pg-core', {
						pgTable: 'pgTable',
						serial: 'serial',
						text: 'text',
						integer: 'integer',
					});

					userSchemaExpression = common.expressionFromString(`pgTable('user', {
                        id: serial('id').primaryKey(),
                        name: text('name').notNull(),
                        age: integer('age'),
                    })`);
				}

				if (!userSchemaExpression) throw new Error('unreachable state...');
				const userIdentifier = variables.declaration(ast, 'const', 'user', userSchemaExpression);
				exports.namedExport(ast, 'user', userIdentifier);
			},
		},
		{
			name: ({ kit, typescript }) =>
				`${kit.libDirectory}/server/db/index.${typescript.installed ? 'ts' : 'js'}`,
			contentType: 'script',
			content: ({ ast, exports, imports, options, common, functions, variables }) => {
				imports.addNamed(ast, '$env/dynamic/private', { env: 'env' });

				// env var checks
				const dbURLCheck = common.statementFromString(
					`if (!env.DATABASE_URL) throw new Error("DATABASE_URL is not set");`,
				);
				common.addStatement(ast, dbURLCheck);

				let clientExpression;
				// SQLite
				if (options.sqlite === 'better-sqlite3') {
					imports.addDefault(ast, 'better-sqlite3', 'Database');
					imports.addNamed(ast, 'drizzle-orm/better-sqlite3', { drizzle: 'drizzle' });

					clientExpression = common.expressionFromString('new Database(env.DATABASE_URL)');
				}
				if (options.sqlite === 'libsql' || options.sqlite === 'turso') {
					imports.addNamed(ast, '@libsql/client', { createClient: 'createClient' });
					imports.addNamed(ast, 'drizzle-orm/libsql', { drizzle: 'drizzle' });

					if (options.sqlite === 'turso') {
						imports.addNamed(ast, '$app/environment', { dev: 'dev' });
						// auth token check in prod
						const authTokenCheck = common.statementFromString(
							`if (!dev && !env.DATABASE_AUTH_TOKEN) throw new Error("DATABASE_AUTH_TOKEN is not set");`,
						);
						common.addStatement(ast, authTokenCheck);

						clientExpression = common.expressionFromString(
							'createClient({ url: env.DATABASE_URL, authToken: env.DATABASE_AUTH_TOKEN })',
						);
					} else {
						clientExpression = common.expressionFromString(
							'createClient({ url: env.DATABASE_URL })',
						);
					}
				}
				// MySQL
				if (options.mysql === 'mysql2') {
					imports.addDefault(ast, 'mysql2/promise', 'mysql');
					imports.addNamed(ast, 'drizzle-orm/mysql2', { drizzle: 'drizzle' });

					clientExpression = common.expressionFromString(
						'await mysql.createConnection(env.DATABASE_URL)',
					);
				}
				if (options.mysql === 'planetscale') {
					imports.addNamed(ast, '@planetscale/database', { Client: 'Client' });
					imports.addNamed(ast, 'drizzle-orm/planetscale-serverless', { drizzle: 'drizzle' });

					clientExpression = common.expressionFromString('new Client({ url: env.DATABASE_URL })');
				}
				// PostgreSQL
				if (options.postgresql === 'neon') {
					imports.addNamed(ast, '@neondatabase/serverless', { neon: 'neon' });
					imports.addNamed(ast, 'drizzle-orm/neon-http', { drizzle: 'drizzle' });

					clientExpression = common.expressionFromString('neon(env.DATABASE_URL)');
				}
				if (options.postgresql === 'postgres.js') {
					imports.addDefault(ast, 'postgres', 'postgres');
					imports.addNamed(ast, 'drizzle-orm/postgres-js', { drizzle: 'drizzle' });

					clientExpression = common.expressionFromString('postgres(env.DATABASE_URL)');
				}

				if (!clientExpression) throw new Error('unreachable state...');
				const clientIdentifier = variables.declaration(ast, 'const', 'client', clientExpression);
				common.addStatement(ast, clientIdentifier);

				const drizzleCall = functions.callByIdentifier('drizzle', ['client']);
				const db = variables.declaration(ast, 'const', 'db', drizzleCall);
				exports.namedExport(ast, 'db', db);
			},
		},
	],
	nextSteps: () => {
		const steps = ['You will need to set DATABASE_URL in your production environment'];

		return steps;
	},
});

function generateEnvFileContent({ content, options }: TextFileEditorArgs<typeof availableOptions>) {
	const DB_URL_KEY = 'DATABASE_URL';
	if (options.docker) {
		// we'll prefill with the default docker db credentials
		const protocol = options.database === 'mysql' ? 'mysql' : 'postgres';
		const port = PORTS[options.database];
		content = addEnvVar(
			content,
			DB_URL_KEY,
			`"${protocol}://root:mysecretpassword@localhost:${port}/local"`,
		);
		return content;
	}
	if (options.sqlite === 'better-sqlite3' || options.sqlite === 'libsql') {
		const dbFile = options.sqlite === 'libsql' ? 'file:local.db' : 'local.db';
		content = addEnvVar(content, DB_URL_KEY, dbFile);
		return content;
	}

	content = addEnvComment(content, 'Replace with your DB credentials!');
	if (options.sqlite === 'turso') {
		content = addEnvVar(content, DB_URL_KEY, `"libsql://db-name-user.turso.io"`);
		content = addEnvVar(content, 'DATABASE_AUTH_TOKEN', `""`);
		content = addEnvComment(content, 'A local DB can also be used in dev as well');
		content = addEnvComment(content, `${DB_URL_KEY}="file:local.db"`);
	}
	if (options.database === 'mysql') {
		content = addEnvVar(content, DB_URL_KEY, `"mysql://user:password@host:port/db-name"`);
	}
	if (options.database === 'postgresql') {
		content = addEnvVar(content, DB_URL_KEY, `"postgres://user:password@host:port/db-name"`);
	}
	return content;
}

function addEnvVar(content: string, key: string, value: string) {
	if (!content.includes(key + '=')) {
		content = appendEnvContent(content, `${key}=${value}`);
	}
	return content;
}

function addEnvComment(content: string, comment: string) {
	const commented = `# ${comment}`;
	if (!content.includes(commented)) {
		content = appendEnvContent(content, commented);
	}
	return content;
}

function appendEnvContent(existing: string, content: string) {
	const withNewLine = !existing.length || existing.endsWith('\n') ? existing : existing + '\n';
	return withNewLine + content + '\n';
}
