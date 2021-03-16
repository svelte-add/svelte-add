#!/usr/bin/env node

let [node, index, adder, ...args] = process.argv;

if (!adder.includes("/")) adder = `svelte-add/${adder}`;
if (!args.includes("--no-ssh")) args = [...args, "--no-ssh"];

process.argv = [node, index, adder, ...args];

require("apply/bin/run");
