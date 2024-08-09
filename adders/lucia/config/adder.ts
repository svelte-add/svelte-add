import { defineAdderConfig, log, Walker, type AstKinds, type AstTypes } from '@svelte-add/core';
import { options } from './options.js';

const LUCIA_ADAPTER = {
	mysql: 'DrizzleMySQLAdapter',
	postgresql: 'DrizzlePostgreSQLAdapter',
	sqlite: 'DrizzleSQLiteAdapter',
} as const;

type Dialect = keyof typeof LUCIA_ADAPTER;

let drizzleDialect: Dialect;
let schemaPath: string;

export const adder = defineAdderConfig({
	metadata: {
		id: 'lucia',
		name: 'Lucia',
		description: 'An auth library that abstracts away the complexity of handling sessions',
		environments: { svelte: false, kit: true },
		website: {
			logo: './lucia.svg',
			keywords: ['lucia', 'lucia-auth', 'auth', 'authentication'],
			documentation: 'https://lucia-auth.com',
		},
	},
	options,
	integrationType: 'inline',
	packages: [
		{ name: 'lucia', version: '^3.2.0', dev: false },
		{ name: '@lucia-auth/adapter-drizzle', version: '^1.1.0', dev: false },
	],
	files: [
		{
			name: ({ typescript }) => `drizzle.config.${typescript.installed ? 'ts' : 'js'}`,
			contentType: 'script',
			content: ({ ast }) => {
				const isProp = (name: string, node: AstTypes.ObjectProperty) =>
					node.key.type === 'Identifier' && node.key.name === name;

				// prettier-ignore
				Walker.walk(ast as AstTypes.ASTNode, {}, {
					ObjectProperty(node) {
						if (isProp("dialect", node) && node.value.type === 'StringLiteral') {
							drizzleDialect = node.value.value as Dialect;
						}
						if (isProp("schema", node) && node.value.type === 'StringLiteral') {
							schemaPath = node.value.value;
						}
					}
				})

				if (!drizzleDialect) {
					// TODO: failed to find dialect
				}
				if (!schemaPath) {
					// TODO: failed to find schema path
				}
			},
		},
		{
			name: () => schemaPath,
			contentType: 'script',
			content: ({ ast, common, exports, imports, object, variables }) => {
				let userInit: AstKinds.ExpressionKind | undefined;
				let sessionInit: AstKinds.ExpressionKind | undefined;
				if (drizzleDialect === 'sqlite') {
					imports.addNamed(ast, 'drizzle-orm/sqlite-core', {
						sqliteTable: 'sqliteTable',
						text: 'text',
						integer: 'integer',
					});
					userInit = common.expressionFromString(`
						sqliteTable('user', {
							id: text('id').primaryKey(),
						});`);
					sessionInit = common.expressionFromString(`
						sqliteTable('session', {
							id: text('id').primaryKey(),
							userId: text("user_id").notNull().references(() => user.id),
							expiresAt: integer("expires_at").notNull()
						});`);
				}
				if (drizzleDialect === 'mysql') {
					imports.addNamed(ast, 'drizzle-orm/mysql-core', {
						mysqlTable: 'mysqlTable',
						varchar: 'varchar',
						datetime: 'datetime',
					});
					userInit = common.expressionFromString(`
						mysqlTable('user', {
							id: varchar('id', { length: 255 }).primaryKey(),
						});`);
					sessionInit = common.expressionFromString(`
						mysqlTable('session', {
							id: varchar('id', { length: 255 }).primaryKey(),
							userId: varchar('id', { length: 255 }).notNull().references(() => user.id),
							expiresAt: datetime("expires_at").notNull()
						});`);
				}
				if (drizzleDialect === 'postgresql') {
					imports.addNamed(ast, 'drizzle-orm/pg-core', {
						pgTable: 'pgTable',
						text: 'text',
						timestamp: 'timestamp',
					});
					userInit = common.expressionFromString(`
						pgTable('user', {
							id: text('id').primaryKey(),
						});`);
					sessionInit = common.expressionFromString(`
						pgTable('session', {
							id: text('id').primaryKey(),
							userId: text("user_id").notNull().references(() => user.id),
							expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull()
						});`);
				}

				if (!userInit || !sessionInit) {
					// TODO: invalid dialects
					return;
				}

				const userDecl = variables.declaration(ast, 'const', 'user', userInit);
				const sessionDecl = variables.declaration(ast, 'const', 'session', sessionInit);
				const user = exports.namedExport(ast, 'user', userDecl);
				const session = exports.namedExport(ast, 'session', sessionDecl);

				// if (drizzleDialect === 'sqlite') {
				// 	user.declaration?.type === 'VariableDeclaration' &&
				// 		user.declaration.declarations[0].type === 'VariableDeclarator' &&
				// 		user.declaration.declarations[0].object.properties(user, {
				// 			id: common.expressionFromString(''),
				// 		});
				// 	object.properties(session, {
				// 		id: common.expressionFromString(''),
				// 		userId: common.expressionFromString(''),
				// 	});
				// }
			},
		},
		{
			name: ({ kit, typescript }) =>
				`${kit.libDirectory}/server/auth.${typescript.installed ? 'ts' : 'js'}`,
			contentType: 'script',
			content: ({ ast, imports, common, exports, typescript, variables }) => {
				const adapter = LUCIA_ADAPTER[drizzleDialect];

				imports.addNamed(ast, '$lib/server/db/schema.js', { user: 'user', session: 'session' });
				imports.addNamed(ast, '$lib/server/db', { db: 'db' });
				imports.addNamed(ast, 'lucia', { Lucia: 'Lucia' });
				imports.addNamed(ast, '@lucia-auth/adapter-drizzle', { [adapter]: adapter });
				imports.addNamed(ast, '$app/environment', { dev: 'dev' });

				// adapter
				const adapterDecl = common.statementFromString(
					`const adapter = new ${adapter}(db, user, session);`,
				);
				common.addStatement(ast, adapterDecl);

				// lucia export
				const luciaInit = common.expressionFromString(`
					new Lucia(adapter, {
						sessionCookie: {
							attributes: {
								secure: !dev
							}
						}
					})`);
				const luciaDecl = variables.declaration(ast, 'const', 'lucia', luciaInit);
				exports.namedExport(ast, 'lucia', luciaDecl);

				// module declaration
				if (typescript.installed) {
					const moduleDecl = common.statementFromString(`
						declare module "lucia" {
							interface Register {
								Lucia: typeof lucia;
							}
						}`);
					if (!common.hasNode(ast, moduleDecl)) {
						common.addStatement(ast, moduleDecl);
					}
				}
			},
		},
		{
			// TODO: comments aren't preserved for some reason
			// TODO: replace console logs for errors or warnings
			name: () => `src/app.d.ts`,
			contentType: 'script',
			content: ({ ast, common }) => {
				const global = ast.body
					.filter((n) => n.type === 'TSModuleDeclaration')
					.find((m) => m.global && m.declare);
				if (!global) {
					console.log('failed to find `declare global`');
					return;
				}

				let app: AstTypes.TSModuleDeclaration | undefined;
				let locals: AstTypes.TSInterfaceDeclaration | undefined;

				// prettier-ignore
				// get off my back, prettier
				Walker.walk(global as AstTypes.ASTNode, {}, {
					TSModuleDeclaration(node, { next }) {
						if (node.id.type === 'Identifier' && node.id.name === 'App') {
							app = node;
						}
						next();
					},
					TSInterfaceDeclaration(node) {
						if (node.id.type === 'Identifier' && node.id.name === 'Locals') {
							locals = node;
						}
					},
				});

				if (!app) {
					console.log('missing `namespace App` declaration');
					return;
				}

				if (app.body?.type !== 'TSModuleBlock') {
					console.log('unexpected body type of `namespace App`');
					return;
				}

				if (!locals) {
					// add Locals interface it if it's missing
					locals = common.statementFromString(
						'interface Locals {}',
					) as AstTypes.TSInterfaceDeclaration;
					app.body.body.push(locals);
				}

				const user = locals.body.body.find((prop) => hasTypeProp('user', prop));
				const session = locals.body.body.find((prop) => hasTypeProp('session', prop));

				if (!user) {
					locals.body.body.push(createLuciaType('user'));
				}
				if (!session) {
					locals.body.body.push(createLuciaType('session'));
				}
			},
		},
		{
			name: ({ typescript }) => `src/hooks.server.${typescript.installed ? 'ts' : 'js'}`,
			contentType: 'script',
			content: ({ ast, imports, exports, common, object }) => {
				// TODO
			},
		},
	],
});

function createLuciaType(name: string): AstTypes.TSInterfaceBody['body'][number] {
	return {
		type: 'TSPropertySignature',
		key: {
			type: 'Identifier',
			name,
		},
		typeAnnotation: {
			type: 'TSTypeAnnotation',
			typeAnnotation: {
				type: 'TSUnionType',
				types: [
					{
						type: 'TSImportType',
						argument: { type: 'StringLiteral', value: 'lucia' },
						qualifier: {
							type: 'Identifier',
							// capitalize first letter
							name: `${name[0].toUpperCase()}${name.slice(1)}`,
						},
					},
					{
						type: 'TSNullKeyword',
					},
				],
			},
		},
	};
}

function hasTypeProp(name: string, node: AstTypes.TSInterfaceDeclaration['body']['body'][number]) {
	return (
		node.type === 'TSPropertySignature' && node.key.type === 'Identifier' && node.key.name === name
	);
}
