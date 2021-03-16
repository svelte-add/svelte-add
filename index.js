#!/usr/bin/env node

import { createRequire } from 'module';
console.log("before createRequire");
const require = createRequire(import.meta.url);
console.log("after createRequire");

let [node, index, adder, ...args] = process.argv;

if (!adder.includes("/")) adder = `svelte-add/${adder}`;
if (!args.includes("--no-ssh")) args = [...args, "--no-ssh"];

process.argv = [node, index, adder, ...args];

console.log("before requiring apply");
require("apply/bin/run");
console.log("after requiring apply");
