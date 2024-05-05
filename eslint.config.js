import js from "@eslint/js";
import eslintPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";

export default [
    js.configs.recommended,
    eslintPrettier,
    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.node,
            },
        },
        rules: {},
    },
    {
        ignores: [
            "**/node_modules/*",
            "**/build/*",
            "adders/*/build",
            "projects/ast-manipulation/build",
            "projects/ast-tooling/build",
            "projects/cli/build",
            "projects/core/build",
            "projects/dev-utils/build",
            "projects/testing-library/build",
            "projects/tests/.outputs",
            "projects/tests/build",
            "projects/website/.svelte-kit",
            "projects/website/build",
        ],
    },
];
