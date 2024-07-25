import { defineAdderTests } from '@svelte-add/core';
import { options } from './options';

const defaultOptionValues = {
	sqlite: options.sqlite.default,
	mysql: options.mysql.default,
	postgresql: options.postgresql.default,
	docker: options.docker.default,
};

export const tests = defineAdderTests({
	options,
	optionValues: [
		{ ...defaultOptionValues, database: 'sqlite', sqlite: 'better-sqlite3' },
		{ ...defaultOptionValues, database: 'sqlite', sqlite: 'libsql' },
		{ ...defaultOptionValues, database: 'mysql', mysql: 'mysql2', docker: true },
		{ ...defaultOptionValues, database: 'postgresql', postgresql: 'postgres.js', docker: true },
	],
	files: [
		{
			name: ({ kit }) => `${kit.routesDirectory}/+page.svelte`,
			contentType: 'svelte',
			condition: ({ kit }) => kit.installed,
			content: ({ html, js }) => {
				js.common.addFromString(js.ast, 'export let data;');
				html.addFromRawHtml(
					html.ast.childNodes,
					`
                    {#each data.users as user}
                        <span data-test-id="user-id-{user.id}">{user.id} {user.name}</span>
                    {/each}
                    `,
				);
			},
		},
		{
			name: ({ kit, typescript }) =>
				`${kit.routesDirectory}/+page.server.${typescript.installed ? 'ts' : 'js'}`,
			contentType: 'script',
			condition: ({ kit }) => kit.installed,
			content: ({ ast, common, typescript }) => {
				common.addFromString(
					ast,
					`
                    import { db } from '$lib/server/db';
                    import { user } from '$lib/server/db/schema.js';

                    export const load = async () => {
                        await insertUser({ name: 'Foobar', id: 0, age: 20 }).catch((err) => console.error(err));

                        const users = await db.select().from(user);

                        return { users };
                    };

                    function insertUser(${typescript.installed ? 'value: typeof user.$inferInsert' : 'value'}) {
                        return db.insert(user).values(value);
                    }
                    `,
				);
			},
		},
		{
			// override the config so we can remove strict mode
			name: ({ typescript }) => `drizzle.config.${typescript.installed ? 'ts' : 'js'}`,
			contentType: 'text',
			condition: ({ kit }) => kit.installed,
			content: ({ content }) => {
				return content.replace('strict: true,', '');
			},
		},
		{
			name: () => 'package.json',
			contentType: 'json',
			content: ({ data }) => {
				// executes after pnpm install
				data.scripts['postinstall'] ??= 'pnpm run db:push';
			},
		},
	],
	tests: [
		{
			name: 'queries database',
			run: async ({ elementExists }) => {
				await elementExists('[data-test-id]');
			},
		},
	],
});
