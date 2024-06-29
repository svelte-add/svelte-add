#!/usr/bin/env node

import { updateDependencies } from "./utils/update-dependencies.js";

async function run() {
    const command = process.argv[2];
    switch (command) {
        case "dependencies":
            await updateDependencies();
            break;

        default:
            throw new Error(`Command '${command}' not found`);
    }
}

void run();
