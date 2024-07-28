# @svelte-add/testing-library

This package provides core tools for testing your adder for different environments and options. Currently we execute tests against 5 project templates:

- svelte-js
- svelte-ts
- kit-js
- kit-js-comments
- kit-ts

Additionally we will test your adder for each option combination that you specify.

Here is a sample usage example:

```js
// test.js

import { remoteControl } from '@svelte-add/core/internal';
import { testAdder } from '@svelte-add/testing-library';

remoteControl.enable();
/** @type {import('@svelte-add/core/adder/config').AdderWithoutExplicitArgs} */
const adder = /** @type {any} */ (await import('./index.js')).default;
remoteControl.disable();

testAdder(adder, {
	outputDirectory: './.outputs',
	headless: true,
	pauseExecutionAfterBrowser: false,
});
```
