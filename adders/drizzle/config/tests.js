import { defineAdderTests } from "@svelte-add/core";
import { options } from "./options";

export const tests = defineAdderTests({
    files: [],
    options,
    optionValues: [{ database: "sqlite" }, { database: "mysql" }, { database: "postgresql" }],
    tests: [],
});
