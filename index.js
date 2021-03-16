#!/usr/bin/env node

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let [node, index, adder, ...args] = process.argv;

if (!adder.includes("/")) adder = `svelte-add/${adder}`;
if (!args.includes("--no-ssh")) args = [...args, "--no-ssh"];

process.argv = [node, index, adder, ...args];

require("apply/bin/run");
