# svelte-add

`svelte-add` is a tool to add many different tools to your svelte/kit project.

This is a monorepo, containing the following packages:
| Package | Description |
|--------------|-----------|
| [@svelte-add/ast-manipulation](./projects/ast-manipulation/README.md) | Provides tools for manipulating JS, CSS and HTML AST's |
| [@svelte-add/ast-tooling](./projects/ast-tooling/README.md) | Bundles different tools for parsing and serializing JS, CSS and HTML AST's |
| [svelte-add](./projects/cli/README.md) | Allows you to apply different adders at once and guides you interactively through the adder initialization |
| [@svelte-add/adders](./adders/README.md) | That's the place where all official adders live |
| [@svelte-add/core](./projects/core/README.md) | Provides all utilities for easy application of adders |
| [@svelte-add/dev-utils](./projects/dev-utils/README.md) | Used to do some maintenance tasks inside the repository |
| [@svelte-add/testing-library](./projects/testing-library/README.md) | Provides tools to test a adders with all it's option in different project templates |
| [@svelte-add/tests](./projects/tests/README.md) | Uses `testing-library` to execute the tests for all official adders |
| [@svelte-add/website](./projects/website/README.md) | The website of this project |

## Contributing

Please see the [contribution guidelines](./CONTRIBUTING.md)

## Licensing

[MIT](./LICENSE)

## Thanks to

-   [J](https://github.com/babichjacob) who initially created [svelte-add](https://github.com/svelte-add/svelte-add)
-   All contributors of [svelte-add](https://github.com/svelte-add/svelte-add)
-   [BlankParticle](https://github.com/BlankParticle) who initially brought up the idea of a [full rewrite](https://github.com/svelte-add/svelte-add/issues/328)
