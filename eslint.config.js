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
            "packages/ast-manipulation/build",
            "packages/ast-tooling/build",
            "packages/cli/build",
            "packages/core/build",
            "packages/dev-utils/build",
            "packages/testing-library/build",
            "packages/tests/.outputs",
            "packages/tests/build",
            "packages/website/.svelte-kit",
            "packages/website/build",
        ],
    },
];
