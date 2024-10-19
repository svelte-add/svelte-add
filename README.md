# svelte-add

> IMPORTANT `svelte-add` has be merged together with `create-svelte` to become the Svelte CLI `sv`. The work continues in the `sv` repo over at [`@sveltejs/cli`](https://github.com/sveltejs/cli)

## Readme
`svelte-add` is a tool to add many different tools to your svelte/kit project.

This is a monorepo, containing the following packages:
| Package | Description |
|--------------|-----------|
| [@svelte-add/ast-manipulation](./packages/ast-manipulation/README.md) | Provides tools for manipulating JS, CSS and HTML AST's |
| [@svelte-add/ast-tooling](./packages/ast-tooling/README.md) | Bundles different tools for parsing and serializing JS, CSS and HTML AST's |
| [svelte-add](./packages/cli/README.md) | Allows you to apply different adders at once and guides you interactively through the adder initialization |
| [@svelte-add/adders](./adders) | That's the place where all official adders live |
| [@svelte-add/core](./packages/core/README.md) | Provides all utilities for easy application of adders |
| [@svelte-add/dev-utils](./packages/dev-utils/README.md) | Used to do some maintenance tasks inside the repository |
| [@svelte-add/testing-library](./packages/testing-library/README.md) | Provides tools to test a adders with all it's option in different project templates |
| [@svelte-add/tests](./packages/tests/README.md) | Uses `testing-library` to execute the tests for all official adders |
| [@svelte-add/website](./packages/website/README.md) | The website of this project |

## Contributing

Please see the [contribution guidelines](./CONTRIBUTING.md)

## Licensing

[MIT](./LICENSE)

## Thanks to

- [J](https://github.com/babichjacob) who initially created [svelte-add](https://github.com/svelte-add/svelte-add)
- All contributors of [svelte-add](https://github.com/svelte-add/svelte-add)
- [BlankParticle](https://github.com/BlankParticle) who initially brought up the idea of a [full rewrite](https://github.com/svelte-add/svelte-add/issues/328)
