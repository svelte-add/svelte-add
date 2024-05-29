import { categories, defineAdderConfig, generateAdderInfo } from "@svelte-add/core";
import pkg from "../package.json";
import { options } from "./options";

export const adder = defineAdderConfig({
    metadata: {
        ...generateAdderInfo(pkg),
        name: "Drizzle",
        description: "Headless TypeScript ORM with a head.",
        category: categories.tools,
        environments: { svelte: false, kit: true },
        website: {
            logo: "./drizzle.svg",
            keywords: ["drizzle", "drizzle-orm", "drizzle-kit", "database", "orm"],
            documentation: "https://orm.drizzle.team/docs/overview",
        },
    },
    options,
    integrationType: "inline",
    packages: [
        { name: "drizzle-orm", version: "^0.30.10", dev: false },
        { name: "drizzle-kit", version: "^0.21.4", dev: true },
        { name: "mysql2", version: "^3.9.8", dev: false, condition: ({ options }) => options.database === "mysql" },
        { name: "pg", version: "^8.11.5", dev: false, condition: ({ options }) => options.database === "postgresql" },
        { name: "@types/pg", version: "^8.11.6", dev: true, condition: ({ options }) => options.database === "postgresql" },
        { name: "better-sqlite3", version: "^10.0.0", dev: false, condition: ({ options }) => options.database === "sqlite" },
        {
            name: "@types/better-sqlite3",
            version: "^7.6.10",
            dev: true,
            condition: ({ options }) => options.database === "sqlite",
        },
    ],
    files: [
        {
            name: () => `.env`,
            contentType: "text",
            content: ({ content, options }) => {
                if (!content.includes("DATABASE_URL=")) {
                    if (options.database === "sqlite") {
                        content += `\nDATABASE_URL="./sqlite.db"`;
                    }
                    if (options.database === "mysql") {
                        content += `\n# Replace with your DB credentials`;
                        content += `\nDATABASE_URL="mysql://user:password@host:port/db-name"`;
                    }
                    if (options.database === "postgresql") {
                        content += `\n# Replace with your DB credentials`;
                        content += `\nDATABASE_URL="postgres://user:password@host:port/db-name"`;
                    }
                }
                return content;
            },
        },
        {
            name: () => `package.json`,
            contentType: "json",
            content: ({ data }) => {
                data.scripts ??= {};
                data.scripts["db:push"] ??= "drizzle-kit push";
                data.scripts["db:migrate"] ??= "drizzle-kit migrate";
                data.scripts["db:studio"] ??= "drizzle-kit studio";
            },
        },
        {
            name: ({ typescript }) => `drizzle.config.${typescript.installed ? "ts" : "js"}`,
            contentType: "script",
            content: ({ options, ast, common, exports, typescript, imports }) => {
                imports.addNamed(ast, "drizzle-kit", { defineConfig: "defineConfig" });

                if (options.database === "sqlite") {
                    imports.addNamed(ast, "node:url", { pathToFileURL: "pathToFileURL" });
                }

                const envCheckStatement = common.statementFromString(
                    `if (!process.env.DATABASE_URL) throw new Error('Missing environment variable: DATABASE_URL');`,
                );
                if (common.hasNode(ast, envCheckStatement) === false) {
                    ast.body.push(envCheckStatement);
                }

                const dbURL =
                    options.database === "sqlite"
                        ? "pathToFileURL(process.env.DATABASE_URL).toString()"
                        : "process.env.DATABASE_URL";

                const defaultExport = common.expressionFromString(`
                defineConfig({
                    schema: './src/lib/server/db/schema.${typescript.installed ? "ts" : "js"}',
                    dialect: '${options.database}',
                    dbCredentials: {
                        url: ${dbURL}
                    },
                    verbose: true,
                    strict: true
                })`);

                exports.defaultExport(ast, defaultExport);
            },
        },
        {
            name: ({ typescript }) => `src/lib/server/db/schema.${typescript ? "ts" : "js"}`,
            contentType: "script",
            content: ({ ast, exports, imports, options, common, variables }) => {
                let userSchemaExpression;
                if (options.database === "sqlite") {
                    imports.addNamed(ast, "drizzle-orm/sqlite-core", {
                        sqliteTable: "sqliteTable",
                        text: "text",
                        integer: "integer",
                    });

                    userSchemaExpression = common.expressionFromString(`sqliteTable('user', {
                        id: integer('id').primaryKey(),
                        name: text('name').notNull(),
                        age: integer('age').notNull()
                    })`);
                }
                if (options.database === "mysql") {
                    imports.addNamed(ast, "drizzle-orm/mysql-core", {
                        mysqlTable: "mysqlTable",
                        serial: "serial",
                        text: "text",
                        int: "int",
                    });

                    userSchemaExpression = common.expressionFromString(`mysqlTable('user', {
                        id: serial("id").primaryKey(),
                        name: text('name').notNull(),
                        age: int('age'),
                    })`);
                }
                if (options.database === "postgresql") {
                    imports.addNamed(ast, "drizzle-orm/pg-core", {
                        pgTable: "pgTable",
                        serial: "serial",
                        text: "text",
                        integer: "integer",
                    });

                    userSchemaExpression = common.expressionFromString(`pgTable('user', {
                        id: serial('id').primaryKey(),
                        name: text('name').notNull(),
                        age: integer('age'),
                    })`);
                }

                if (!userSchemaExpression) throw new Error("unreachable state...");
                const userIdentifier = variables.declaration(ast, "const", "user", userSchemaExpression);
                exports.namedExport(ast, "user", userIdentifier);
            },
        },
        {
            name: ({ typescript }) => `src/lib/server/db/index.${typescript ? "ts" : "js"}`,
            contentType: "script",
            content: ({ ast, exports, imports, options, common, functions, variables }) => {
                let clientExpression;
                if (options.database === "sqlite") {
                    imports.addDefault(ast, "better-sqlite3", "Database");
                    imports.addNamed(ast, "drizzle-orm/better-sqlite3", { drizzle: "drizzle" });

                    clientExpression = common.expressionFromString("new Database(env.DATABASE_URL)");
                }
                if (options.database === "mysql") {
                    imports.addDefault(ast, "mysql2/promise", "mysql");
                    imports.addNamed(ast, "drizzle-orm/mysql2", { drizzle: "drizzle" });

                    clientExpression = common.expressionFromString("await mysql.createConnection(env.DATABASE_URL)");
                }
                if (options.database === "postgresql") {
                    imports.addNamed(ast, "pg", { Client: "Client" });
                    imports.addNamed(ast, "drizzle-orm/node-postgres", { drizzle: "drizzle" });

                    clientExpression = common.expressionFromString("new Client(env.DATABASE_URL)");
                }

                imports.addNamed(ast, "$env/dynamic/private", { env: "env" });

                if (!clientExpression) throw new Error("unreachable state...");
                const clientIdentifier = variables.declaration(ast, "const", "client", clientExpression);
                if (common.hasNode(ast, clientIdentifier) === false) {
                    ast.body.push(clientIdentifier);
                }

                if (options.database === "postgresql") {
                    const connectExpression = common.expressionFromString("await client.connect()");
                    ast.body.push(common.expressionStatement(connectExpression));
                }

                const drizzleCall = functions.callByIdentifier("drizzle", ["client"]);
                const db = variables.declaration(ast, "const", "db", drizzleCall);
                exports.namedExport(ast, "db", db);
            },
        },
    ],
});
