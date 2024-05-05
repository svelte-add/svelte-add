#!/usr/bin/env node

import { generateAdderReadmes } from "./utils/generate-readme.js";
import { updateAdderPackages } from "./utils/update-packages.js";

const command = process.argv[2];

switch (command) {
    case "readmes":
        // There is no real need to call this command manually. This script is called by ci during versioning.
        await generateAdderReadmes();
        break;
    case "packages":
        // There is no real need to call this command manually. This script is called by ci during versioning.
        await updateAdderPackages();
        break;

    default:
        throw new Error(`Command '${command}' not found`);
}
