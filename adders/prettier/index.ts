#!/usr/bin/env node

import { defineAdder } from "@svelte-add/core";
import { adder } from "./config/adder.js";
import { checks } from "./config/checks.js";
import { tests } from "./config/tests.js";

export default defineAdder(adder, checks, tests);
