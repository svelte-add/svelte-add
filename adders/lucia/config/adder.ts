import { defineAdderConfig, log, Walker, type AstKinds, type AstTypes } from '@svelte-add/core';
import { options } from './options.js';

const LUCIA_ADAPTER = {
	mysql: 'DrizzleMySQLAdapter',
	postgresql: 'DrizzlePostgreSQLAdapter',
	sqlite: 'DrizzleSQLiteAdapter',
} as const;

const TABLE_TYPE = {
	mysql: 'mysqlTable',
	postgresql: 'pgTable',
	sqlite: 'sqliteTable',
};

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
	runsAfter: ['drizzle'],
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
			content: ({ ast, common, exports, imports, variables, object, functions }) => {
				const createTable = (name: string) => functions.call(TABLE_TYPE[drizzleDialect], [name]);

				const userDecl = variables.declaration(ast, 'const', 'user', createTable('user'));
				const sessionDecl = variables.declaration(ast, 'const', 'session', createTable('session'));

				const user = exports.namedExport(ast, 'user', userDecl);
				const session = exports.namedExport(ast, 'session', sessionDecl);

				const userTable = getCallExpression(user);
				const sessionTable = getCallExpression(session);

				if (!userTable || !sessionTable) {
					throw new Error('failed to find call expression of `user` or `session`');
				}

				if (userTable.arguments.length === 1) {
					userTable.arguments.push(object.createEmpty());
				}
				if (sessionTable.arguments.length === 1) {
					sessionTable.arguments.push(object.createEmpty());
				}

				const userAttributes = userTable.arguments[1];
				const sessionAttributes = sessionTable.arguments[1];
				if (
					userAttributes.type !== 'ObjectExpression' ||
					sessionAttributes.type !== 'ObjectExpression'
				) {
					throw new Error('unexpected shape of `user` or `session` table definition');
				}

				if (drizzleDialect === 'sqlite') {
					imports.addNamed(ast, 'drizzle-orm/sqlite-core', {
						sqliteTable: 'sqliteTable',
						text: 'text',
						integer: 'integer',
					});
					object.overrideProperties(userAttributes, {
						id: common.expressionFromString(`text('id').primaryKey()`),
					});
					object.overrideProperties(sessionAttributes, {
						id: common.expressionFromString(`text('id').primaryKey()`),
						userId: common.expressionFromString(
							`text("user_id").notNull().references(() => user.id)`,
						),
						expiresAt: common.expressionFromString(`integer("expires_at").notNull()`),
					});
				}
				if (drizzleDialect === 'mysql') {
					imports.addNamed(ast, 'drizzle-orm/mysql-core', {
						mysqlTable: 'mysqlTable',
						varchar: 'varchar',
						datetime: 'datetime',
					});
					object.overrideProperties(userAttributes, {
						id: common.expressionFromString(`varchar('id', { length: 255 }).primaryKey()`),
					});
					object.overrideProperties(sessionAttributes, {
						id: common.expressionFromString(`varchar('id', { length: 255 }).primaryKey()`),
						userId: common.expressionFromString(
							`varchar('id', { length: 255 }).notNull().references(() => user.id)`,
						),
						expiresAt: common.expressionFromString(`datetime("expires_at").notNull()`),
					});
				}
				if (drizzleDialect === 'postgresql') {
					imports.addNamed(ast, 'drizzle-orm/pg-core', {
						pgTable: 'pgTable',
						text: 'text',
						timestamp: 'timestamp',
					});
					object.overrideProperties(userAttributes, {
						id: common.expressionFromString(`text('id').primaryKey()`),
					});
					object.overrideProperties(sessionAttributes, {
						id: common.expressionFromString(`text('id').primaryKey()`),
						userId: common.expressionFromString(
							`text("user_id").notNull().references(() => user.id)`,
						),
						expiresAt: common.expressionFromString(
							`timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull()`,
						),
					});
				}
			},
		},
		{
			name: ({ kit, typescript }) =>
				`${kit.libDirectory}/server/auth.${typescript.installed ? 'ts' : 'js'}`,
			contentType: 'script',
			content: ({ ast, imports, common, exports, source, typescript, variables }) => {
				const adapter = LUCIA_ADAPTER[drizzleDialect];

				imports.addNamed(ast, '$lib/server/db/schema.js', { user: 'user', session: 'session' });
				imports.addNamed(ast, '$lib/server/db', { db: 'db' });
				imports.addNamed(ast, 'lucia', { Lucia: 'Lucia' });
				imports.addNamed(ast, '@lucia-auth/adapter-drizzle', { [adapter]: adapter });
				imports.addNamed(ast, '$app/environment', { dev: 'dev' });

				// adapter
				const adapterDecl = common.statementFromString(
					`const adapter = new ${adapter}(db, session, user);`,
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
				if (typescript.installed && !/declare module ["']lucia["']/.test(source)) {
					const moduleDecl = common.statementFromString(`
						declare module "lucia" {
							interface Register {
								Lucia: typeof lucia;
							}
						}`);
					common.addStatement(ast, moduleDecl);
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
			content: ({ ast, imports, exports, common, typescript, variables, functions }) => {
				imports.addNamed(ast, '$lib/server/auth.js', { lucia: 'lucia' });

				if (typescript.installed) {
					imports.addNamed(ast, '@sveltejs/kit', { Handle: 'Handle' }, true);
				}

				let isSpecifier: boolean = false;
				let handleName = 'handle';
				let exportDecl: AstTypes.ExportNamedDeclaration | undefined;
				let originalHandleDecl: AstKinds.DeclarationKind | undefined;

				// We'll first visit all of the named exports and grab their references if they export `handle`.
				// This will grab export references for:
				// `export { handle }` & `export { foo as handle }`
				// `export const handle = ...`, & `export function handle() {...}`
				// prettier-ignore
				Walker.walk(ast as AstTypes.ASTNode, {}, {
					ExportNamedDeclaration(node) {
						let maybeHandleDecl: AstKinds.DeclarationKind | undefined;

						// `export { handle }` & `export { foo as handle }`
						const handleSpecifier = node.specifiers?.find((s) => s.exported.name === 'handle');
						if (handleSpecifier) {
							isSpecifier = true;
							// we'll search for the local name in case it's aliased (e.g. `export { foo as handle }`)
							handleName = handleSpecifier.local?.name ?? handleSpecifier.exported.name;

							// find the definition
							const handleFunc = ast.body.find((n) => isFunctionDeclarationHandle(n, handleName));
							const handleVar = ast.body.find((n) => isVariableDeclarationHandle(n, handleName));

							maybeHandleDecl = handleFunc ?? handleVar;
						}

						maybeHandleDecl ??= node.declaration ?? undefined;

						// `export const handle`
						if (maybeHandleDecl && isVariableDeclarationHandle(maybeHandleDecl, handleName)) {
							exportDecl = node;
							originalHandleDecl = maybeHandleDecl;
						}

						// `export function handle`
						if (maybeHandleDecl && isFunctionDeclarationHandle(maybeHandleDecl, handleName)) {
							exportDecl = node;
							originalHandleDecl = maybeHandleDecl;
						}
					},
				});

				const authHandle = common.expressionFromString(getAuthHandleContent());
				if (common.hasNode(ast, authHandle)) return;

				// This is the straightforward case. If there's no existing `handle`, we'll just add one
				// with the `auth` handle's definition and exit
				if (!originalHandleDecl || !exportDecl) {
					// handle declaration doesn't exist, so we'll just create it with the hook
					const authDecl = variables.declaration(ast, 'const', handleName, authHandle);
					if (typescript.installed) {
						const declarator = authDecl.declarations[0] as AstTypes.VariableDeclarator;
						variables.typeAnnotateDeclarator(declarator, 'Handle');
					}

					exports.namedExport(ast, handleName, authDecl);

					return;
				}

				// create the `auth` handle
				const authName = 'auth';
				const authDecl = variables.declaration(ast, 'const', authName, authHandle);
				if (typescript.installed) {
					const declarator = authDecl.declarations[0] as AstTypes.VariableDeclarator;
					variables.typeAnnotateDeclarator(declarator, 'Handle');
				}

				// check if `handle` is using a sequence
				let sequence: AstTypes.CallExpression | undefined;
				if (originalHandleDecl.type === 'VariableDeclaration') {
					const handle = originalHandleDecl.declarations.find(
						(d) => d.type === 'VariableDeclarator' && usingSequence(d, handleName),
					) as AstTypes.VariableDeclarator | undefined;

					sequence = handle?.init as AstTypes.CallExpression;
				}

				// If `handle` is already using a `sequence`, then we'll just create the `auth` handle and
				// append `auth` to the args of `sequence`
				// e.g. `export const handle = sequence(some, other, handles, auth);`
				if (sequence) {
					const hasAuthArg = sequence.arguments.some(
						(arg) => arg.type === 'Identifier' && arg.name === authName,
					);
					if (!hasAuthArg) {
						sequence.arguments.push(variables.identifier(authName));
					}

					// removes the declarations so we can append them in the correct order
					ast.body = ast.body.filter(
						(n) => n !== originalHandleDecl && n !== exportDecl && n !== authDecl,
					);
					if (isSpecifier) {
						// if export specifiers are being used (e.g. `export { handle }`), then we'll want
						// need to also append original handle declaration as it's not part of the export declaration
						ast.body.push(authDecl, originalHandleDecl, exportDecl);
					} else {
						ast.body.push(authDecl, exportDecl);
					}

					return;
				}

				// At this point, the existing `handle` doesn't call `sequence`, so we'll need to rename the original
				// `handle` and create a new `handle` that uses `sequence`
				// e.g. `const handle = sequence(originalHandle, auth);`
				const NEW_HANDLE_NAME = 'originalHandle';
				const sequenceCall = functions.callByIdentifier('sequence', [NEW_HANDLE_NAME, authName]);
				const newHandleDecl = variables.declaration(ast, 'const', handleName, sequenceCall);

				imports.addNamed(ast, '@sveltejs/kit/hooks', { sequence: 'sequence' });

				// rename `export const handle`
				if (originalHandleDecl && isVariableDeclarationHandle(originalHandleDecl, handleName)) {
					const handle = getVariableDeclarator(originalHandleDecl, handleName);
					if (handle && handle.id.type === 'Identifier') {
						handle.id.name = NEW_HANDLE_NAME;
					}
				}
				// rename `export function handle`
				if (originalHandleDecl && isFunctionDeclarationHandle(originalHandleDecl, handleName)) {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					originalHandleDecl.id!.name = NEW_HANDLE_NAME;
				}

				// removes all declarations so that we can re-append them in the correct order
				ast.body = ast.body.filter(
					(n) => n !== originalHandleDecl && n !== exportDecl && n !== authDecl,
				);

				if (isSpecifier) {
					ast.body.push(originalHandleDecl, authDecl, newHandleDecl, exportDecl);
				}

				if (exportDecl.declaration) {
					// when we re-append the declarations, we only want to add the declaration
					// of the (now renamed) original `handle` _without_ the `export` keyword:
					// e.g. `const originalHandle = ...;`
					ast.body.push(exportDecl.declaration, authDecl);
					// `export const handle = sequence(originalHandle, auth);`
					exports.namedExport(ast, handleName, newHandleDecl);
				}
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

function usingSequence(node: AstTypes.VariableDeclarator, handleName: string) {
	return (
		node.id.type === 'Identifier' &&
		node.id.name === handleName &&
		node.init?.type === 'CallExpression' &&
		node.init.callee.type === 'Identifier' &&
		node.init.callee.name === 'sequence'
	);
}

function isVariableDeclarationHandle(
	node: AstTypes.ASTNode,
	handleName: string,
): node is AstTypes.VariableDeclaration {
	return (
		node.type === 'VariableDeclaration' &&
		node.declarations.some(
			(d) =>
				d.type === 'VariableDeclarator' && d.id.type === 'Identifier' && d.id.name === handleName,
		)
	);
}

function getVariableDeclarator(
	node: AstTypes.VariableDeclaration,
	handleName: string,
): AstTypes.VariableDeclarator | undefined {
	return node.declarations.find(
		(d) =>
			d.type === 'VariableDeclarator' && d.id.type === 'Identifier' && d.id.name === handleName,
	) as AstTypes.VariableDeclarator | undefined;
}

function isFunctionDeclarationHandle(
	node: AstTypes.ASTNode,
	handleName: string,
): node is AstTypes.FunctionDeclaration {
	return node.type === 'FunctionDeclaration' && node.id?.name === handleName;
}

function getAuthHandleContent() {
	return `
		async ({ event, resolve }) => {
			const sessionId = event.cookies.get(lucia.sessionCookieName);
			if (!sessionId) {
				event.locals.user = null;
				event.locals.session = null;
				return resolve(event);
			}

			const { session, user } = await lucia.validateSession(sessionId);
			if (session && session.fresh) {
				const sessionCookie = lucia.createSessionCookie(session.id);
				event.cookies.set(sessionCookie.name, sessionCookie.value, {
					path: ".",
					...sessionCookie.attributes
				});
			}
			if (!session) {
				const sessionCookie = lucia.createBlankSessionCookie();
				event.cookies.set(sessionCookie.name, sessionCookie.value, {
					path: ".",
					...sessionCookie.attributes
				});
			}
			event.locals.user = user;
			event.locals.session = session;
			return resolve(event);
		};`;
}

function getCallExpression(ast: AstTypes.ASTNode): AstTypes.CallExpression | undefined {
	let callExpression;

	// prettier-ignore
	Walker.walk(ast, {}, {
		CallExpression(node) {
			callExpression ??= node;
		},
	});

	return callExpression;
}
