#!/usr/bin/env node
import("./cli.js").catch((error) => {
	const { bold, red } = require("kleur");
	if (error.name === "SyntaxError") console.error(bold(red(`You must be on the latest version of Node 14 or 16 to use svelte-add. You're currently on ${process.version}\nSee the existing issue at https://github.com/svelte-add/svelte-add/issues/41`)));
	throw error;
});
