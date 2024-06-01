import { defineAdderOptions } from "@svelte-add/core";

export const options = defineAdderOptions({
    database: {
        question: "Which database would you like to use?",
        type: "select",
        default: "sqlite",
        options: [
            { value: "sqlite", label: "SQLite" },
            { value: "mysql", label: "MySQL" },
            { value: "postgresql", label: "PostgreSQL" },
        ],
    },
    sqlite: {
        question: "Which SQLite client would you like to use?",
        type: "select",
        default: undefined,
        options: [
            { value: "better-sqlite3", label: "better-sqlite3" },
            { value: "turso", label: "Turso" },
            // { value: "d1", label: "Cloudflare D1" },
        ],
        condition: ({ database }) => database === "sqlite",
    },
    mysql: {
        question: "Which MySQL client would you like to use?",
        type: "select",
        default: undefined,
        options: [
            { value: "mysql2", label: "mysql2" },
            { value: "planetscale", label: "PlanetScale" },
        ],
        condition: ({ database }) => database === "mysql",
    },
    postgresql: {
        question: "Which PostgreSQL client would you like to use?",
        type: "select",
        default: undefined,
        options: [
            { value: "node-postgres", label: "node-postgres" },
            // { value: "postgres.js", label: "Postgres.JS" },
            { value: "supabase", label: "Supabase" },
            { value: "neon", label: "Neon" },
        ],
        condition: ({ database }) => database === "postgresql",
    },
    docker: {
        question: "Do you want to run the database locally with docker-compose?",
        default: false,
        type: "boolean",
        condition: ({ mysql, postgresql }) => mysql === "mysql2" || postgresql === "node-postgres",
    },
});
