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

-   Install dependencies `pnpm install`

Run the following command to create a new adder automatically:

```bash
pnpm run adders:create adders/[YOUR ADDER]
```

-   Navigate to `adders/[YOUR_ADDER]`
-   Define the required dependencies under the packages property in `config/adder.ts`
-   Define any files that will need to be created or modified by the adder under the files property in `config/adder.ts`
-   The svg will be blank so you will want to find an svg for your adder
-   Define any options for your adder under `config/options.ts`
-   Define any tests for your adder under `config/tests.ts`

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

## website

Our website depends on our internal packages present in the repo. Please run the following commands to start developing on the website.

```sh
pnpm build:prod # builds all adders and their dependant projects
pnpm website:dev # starts the website.
```

Please don't forget to add a changeset, see [changesets](#changesets)
