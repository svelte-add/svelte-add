# Contributing

## Local development

### Pnpm

As we have multiple packages in this repo, we are using [pnpm](https://pnpm.io/) instead of `npm`.

### Let's go

-   clone the repo
-   run `pnpm i` to install all dependencies
-   transpile typescript to javascript with `pnpm build:prod`
-   execute whatever program you want.

If you want to do multiple changes to the projects, consider replacing `pnpm build:prod` with `pnpm build:dev` to start the typescript transpiler in watch mode.

### Before you commit

Make sure each of the programs below executes successfully. After that, please check if you need to create a [changeset](#changesets)

-   `pnpm eslint:check` (run `pnpm eslint:fix` to potentially fix, manual intervention usually necessary)
-   `pnpm prettier:check` (run `pnpm prettier:fix` to fix)
-   `pnpm test`

### Changesets

We use [changesets](https://github.com/changesets/changesets/blob/main/docs/adding-a-changeset.md) to control our release process. If you have implemented meaningful changes please add a changeset.

```shell
pnpm changeset
```

## create new adder

-   stop development server
-   duplicate existing adder, and make some minor modification (like package name)
-   delete its `node_modules` and `build` folder
-   delete the `CHANGELOG.md` file
-   add the new adders as a peer dependency to `svelte-add`
-   set an appropriate package name & version version in `package.json`
-   run `pnpm install` (ignore the warnings)
-   add your adder to one of the categories in [`./packages/config/adders/official.ts`](./packages/config/adders/official.ts)
-   start development server `pnpm build:dev`
-   once you have finished developing your adder, don't forget to generate the readme `pnpm utils:readmes` & the `package.json` with `pnpm utils:packages`

## test a adder

The easiest way to test a adder is to run it's cli directly.

```sh
npx ./adders/bulma
```

Alternatively you can also run the testsuite of a adder with this command:

```sh
pnpm test bulma mdsvex
```

And if you have made changes to the core packages, you should probably run the full test suite for all adders. But keep in mind, this takes time!
