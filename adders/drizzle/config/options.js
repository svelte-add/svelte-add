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
        default: "better-sqlite3",
        options: [
            { value: "better-sqlite3", label: "better-sqlite3" },
            { value: "http", label: "SQLite HTTP Driver" },
        ],
        condition: ({ database }) => database === "sqlite",
    },
    mysql: {
        question: "Which MySQL client would you like to use?",
        type: "select",
        default: "mysql2",
        options: [
            { value: "mysql", label: "mysql2" },
            { value: "http", label: "MySQL HTTP Driver" },
        ],
        condition: ({ database }) => database === "mysql",
    },
    postgresql: {
        question: "Which PostgreSQL client would you like to use?",
        type: "select",
        default: "node-postgres",
        options: [
            { value: "node-postgres", label: "node-postgres" },
            { value: "http", label: "PostgreSQL HTTP Driver" },
        ],
        condition: ({ database }) => database === "postgresql",
    },
});
