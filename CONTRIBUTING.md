# Contributing

## Local development

### Pnpm

As we have multiple packages in this repo, we are using [pnpm](https://pnpm.io/) instead of `npm`.

### Let's go

@svelte-add/testing-library

- clone the repo
- run `pnpm i` to install all dependencies
- transpile typescript to javascript with `pnpm build`
- execute whatever program you want.

If you want to do multiple changes to the projects, consider replacing `pnpm build` with `pnpm dev` to start the typescript transpiler in watch mode.

### Before you commit

Make sure each of the programs below executes successfully. After that, please check if you need to create a [changeset](#changesets)

- `pnpm lint` (run `pnpm format` to fix formatting issues. Manual intervention is usually necessary for linting issues though)
- `pnpm check`
- `pnpm test`

### Changesets

We use [changesets](https://github.com/changesets/changesets/blob/main/docs/adding-a-changeset.md) to control our release process. If you have implemented meaningful changes please add a changeset.

```shell
pnpm changeset
```

## create new adder

- stop development server (if running)
- duplicate existing adder folder, and make some minor modification (like package name)
- add your adder to one of the categories in [`./packages/config/adders/official.ts`](./packages/config/adders/official.ts)
- start development server `pnpm dev`
- You are good to go - you can now change whatever is required for your adder.

## test a adder

The easiest way to test a adder is to run it's cli directly.

```sh
pnpm svelte-add tailwindcss
```

Alternatively you can also run the testsuite of a adder with this command:

```sh
pnpm test -t tailwindcss
```

And if you have made changes to the core packages, you should probably run the full test suite for all adders. But keep in mind, this takes time!

## website

Our website depends on our internal packages present in the repo. Please run the following commands to start developing on the website.

```sh
pnpm build # builds all adders and their dependant projects
pnpm website:dev # starts the website.
```

Please don't forget to add a changeset, see [changesets](#changesets)
