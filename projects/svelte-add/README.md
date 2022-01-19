<h1 align="center">➕ Svelte Add</h1>
This is a community project to easily add integrations and other functionality to Svelte apps. Its goal is to solve the  problems with downloading templates to start your app from:

- You have to want _all_ the functionality a template includes—no more, no less.

  `svelte-add` has app initializers that let you select the exact integrations wanted: `npm init @svelte-add/kit@latest`

- You have to fall back on following a third party tutorial that could be outdated or take a lot of work to add things missing from that template.

  `svelte-add`'s "tutorials" are one step: `npx --yes svelte-add@latest graphql-server`

- You have to rely on the maintainer keeping the template updated as the tools it uses change and the official Svelte app template it was built on changes.

  `svelte-add`'s app initializers are always built on top of the latest version of the official Svelte app templates. Of course it still needs to be maintained as tools change (like Tailwind JIT or the future rewrite of mdsvex), but because it is in a central location and contributed to by many people, problems are found quickly, and fixes are for everyone—not just one specific template.

## 🪄 Built-in integration adders

In theory, these adders are the most likely to work correctly:

- [**3D**](https://github.com/svelte-add/3d)
- [**Bootstrap**](https://github.com/svelte-add/bootstrap)
- [**Bulma**](https://github.com/svelte-add/bulma)
- [**CoffeeScript**](https://github.com/svelte-add/coffeescript)
- [**mdsvex**](https://github.com/svelte-add/mdsvex)
- [**PostCSS**](https://github.com/svelte-add/postcss)
- [**SCSS**](https://github.com/svelte-add/scss)
- [**Tailwind CSS**](https://github.com/svelte-add/tailwindcss)

## 📨 External integration adders

`svelte-add` is currently being rewritten, so many integrations are still external (added in a primitive and buggy way, unfortunately), until that is complete:

- [**Firebase Hosting**](https://github.com/svelte-add/firebase-hosting)
- [**GraphQL server**](https://github.com/svelte-add/graphql-server)
- [**Jest**](https://github.com/rossyman/svelte-add-jest)
- [**Pug**](https://github.com/Leftium/pug-adder)
- [**Supabase**](https://github.com/joshnuss/svelte-supabase)

## 🧰 Creating a SvelteKit app with integrations

The preferred way to add integrations to a SvelteKit app is to start a new one, choosing the ones you want:

```sh
npm init @svelte-add/kit@latest
# Follow the prompts to select the integrations you want
```

If you have a favorite setup, you can recreate it without having to provide any interactive input:

```sh
npm init --yes @svelte-add/kit@latest -- --with postcss+mdsvex
```

Here's a more complete example: to migrate from [`sapper-firebase-typescript-graphql-tailwindcss-actions-template`](https://github.com/babichjacob/sapper-firebase-typescript-graphql-tailwindcss-actions-template) to SvelteKit, this command can be run to recreate all the functionality:

```sh
npm init --yes @svelte-add/kit@latest my-new-app -- --with firebase-hosting+typescript+graphql-server+tailwindcss+eslint+prettier --firebase-hosting-project my-project-123
# NOTE: The Firebase Hosting adder doesn't support this yet.
```

## ⚡️ Creating a Vite-powered Svelte app with integrations

The preferred way to add integrations to a Vite-powered Svelte app is to start a new one, choosing the ones you want:

```sh
npm init @svelte-add/vite@latest
# Follow the prompts to select the integrations you want
```

If you have a favorite setup, you can recreate it without having to provide any interactive input:

```sh
npm init --yes @svelte-add/vite@latest -- --with bulma+mdsvex
```

## 🧩 Adding one integration at a time

Ideally, you can `svelte-add` an integration any time after app initialization:

```sh
# Suppose you started a SvelteKit project
npm init svelte@next

# Then realized you want to write your styles in SCSS
npx --yes svelte-add@latest scss
```

but there are practically infinite scenarios that an automated tool like this cannot expect, so it doesn't always work. For that reason, we recommend choosing integrations with the appropriate app initializer (SvelteKit or Vite) for an instant result and [creating an issue for an eventual fix](https://github.com/svelte-add/svelte-add/issues).

Adders should all be _composable_, meaning that it should always be possible to run one after another without something breaking:

```sh
npx --yes svelte-add@latest coffeescript
npx --yes svelte-add@latest mdsvex
# CoffeeScript should still work
```

### 🦺 Safely adding integrations and examining changes

Like when making any significant changes to a repository, ensure you have a backup of your project before `svelte-add`ing an integration. 

```sh
# Create a git commit with the current project state
git add .
git commit -m "before adding bootstrap"

# Push it to the remote server
git push
# Create another backup if you deem it necessary

# Add an integration
npx svelte-add@latest bootstrap
```

If you are curious what changes `svelte-add` made to your code, you can use `git` to examine what changed since the last commit:

```sh
git add --intent-to-add .
git diff
```

And revert it if needed:

```sh
git reset --hard HEAD
```

## ⚙️ Options

- the output directory when initializing a Svelte app.
- `demos` (default `false`): whether or not to include demonstration code to teach about the integrations and application framework used.
- `install` (default `true` if initializing a Svelte app, otherwise `false`): whether or not to automatically install dependencies after adding integrations.
- `package-manager` (default `pnpm` if installed, then `yarn` if installed, then `npm`): which package manager to use when initializing a Svelte app or installing dependencies.
- `with` (default `javascript+css`): the features (adders and built-in options like `eslint`, `prettier`, and `typescript`) to initialize the Svelte app with.

The specific adders you're using might have their own options, so see their `README` for that information. For example, [the Tailwind CSS adder](https://github.com/svelte-add/tailwindcss) takes a `forms` option and a `typography` option.

## 🧓 Support for Elder.js

No adders currently support Elder.js, but we would like to! If you can help, see [the open issue for it](https://github.com/svelte-add/svelte-add/issues/42).

## 🧭 Support for Routify

No adders currently support Routify. If you can help `svelte-add` support Routify, see [the open issue for it](https://github.com/svelte-add/svelte-add/issues/165).

## 🌱 Support for Sapper

Sapper is a legacy project, so `svelte-add` will (probably) never support it.

## 🏔 Support for Snowpack

Snowpack is a very similar project to Vite, so we recommend using Vite if possible (see the "Creating a Vite app with integrations" section). If you can help `svelte-add` support Snowpack, [create an issue to talk about it](https://github.com/svelte-add/svelte-add/issues).

## 🌐 Support for Svelte with webpack or Rollup

I personally expect that almost everyone can transition away from these traditional bundlers to Vite without loss of functionality, so there is no planned support for webpack- or Rollup-powered Svelte apps. See the "Creating a Vite app with integrations" section for the recommended approach.

## 🎁 Contributing

This is a community project! Here are some ways you can help:

- Battle test (combinations of) adders to make sure they're always composable and find other edge cases, bugs, etc.
- Fix known issues and missing features in an adder per the open issues in this repository (if it's built-in) or its repository (if it's external).
- Read this repository's open issues to talk about [ideas for new adders](https://github.com/svelte-add/svelte-add/issues?q=is%3Aissue+is%3Aopen+label%3A%22make+a+new+adder%22).
- Create a [pull request](https://github.com/svelte-add/svelte-add/pulls) to add your adder to the external integration adders list. Most adders will be rewritten built-in to `svelte-add` given enough time!

### 🧪 Developing Locally

1. Clone the monorepo with submodules: `git clone --recurse-submodules https://github.com/svelte-add/svelte-add`
2. Install dependencies: `pnpm install` (make sure that you have [installed `pnpm` before](https://pnpm.io/installation#using-npm))
3. Make changes to the project and verify them with:

   - `pnpm -w lint` (usually fixable with `pnpm -w format`)
   - `pnpm -w check`
   - `pnpm -r test`. Modify `projects/test/tests/one-adder.js` with the right adder to test.

## 📄 License

MIT

## 🙏 Attribution

`svelte-add` takes inspiration from existing projects:

- [Preset](https://preset.dev/)
- [`snowpack-start`](https://github.com/awu43/snowpack-start)
- [`stackmix`](https://github.com/roxiness/stackmix)

_Repository preview image generated with [GitHub Social Preview](https://social-preview.pqt.dev/)_

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
