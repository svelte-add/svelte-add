<h1 align="center">➕ Svelte Add</h1>
This is a community project to easily add integrations and other functionality to Svelte apps. Its goal is to solve the  problems with downloading templates to start your app from:

- You have to want _all_ the functionality a template includes—no more, no less.

  `svelte-add` has app initializers that let you select the exact integrations wanted: `npm init @svelte-add/kit -- --with typescript+tailwindcss`

- You have to fall back on following a third party tutorial that could be outdated or take a lot of work to add things missing from that template.

  `svelte-add`'s "tutorials" are one step: `npx svelte-add@latest graphql-server`

- You have to rely on the maintainer keeping the template updated as the tools it uses change and the official Svelte app template it was built on changes.

  `svelte-add`'s app initializers are always built on top of the latest version of the official Svelte app templates. Of course it still needs to be maintained as tools change (like Tailwind JIT or the future rewrite of mdsvex), but because it is in a central location and contributed to by many people, problems are found quickly, and fixes are for everyone—not just one specific template.

## 🪄 Built-in integration adders

In theory, these adders are the most likely to work correctly. While `svelte-add` is being rewritten, very few adders will be on this list:

- [**mdsvex**](https://github.com/svelte-add/mdsvex)
- [**PostCSS**](https://github.com/svelte-add/postcss)
- [**SCSS**](https://github.com/svelte-add/scss)
- [**Tailwind CSS**](https://github.com/svelte-add/tailwindcss)

## 📨 External integration adders

`svelte-add` is currently being rewritten, so most integrations are still external (added in a primitive and buggy way, unfortunately), until that is complete:

- [**Bulma**](https://github.com/svelte-add/bulma)
- [**CoffeeScript**](https://github.com/Leftium/coffeescript-adder)
- [**GraphQL server**](https://github.com/svelte-add/graphql-server)
- [**Hosting on Firebase**](https://github.com/svelte-add/firebase-hosting)
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
npm init --yes @svelte-add/kit@latest -- --with tailwindcss+mdsvex
```

Here's a more complete example: to migrate from [`sapper-firebase-typescript-graphql-tailwindcss-actions-template`](https://github.com/babichjacob/sapper-firebase-typescript-graphql-tailwindcss-actions-template) to SvelteKit, this command can be run to recreate all the functionality:

```sh
npm init --yes @svelte-add/kit@latest my-new-app -- --with firebase-hosting+typescript+graphql-server+tailwindcss+eslint+prettier --firebase-hosting-project my-project-123
# NOTE: The Hosting on Firebase adder doesn't support this yet.
```

## ⚡️ Creating a Vite-powered Svelte app with integrations

The preferred way to add integrations to a Vite-powered Svelte app is to start a new one, choosing the ones you want:

```sh
# NOTE: This is not implemented yet.
npm init @svelte-add/vite@latest
# Follow the prompts to select the integrations you want
```

At the time of writing, this is not implemented, so see the "Adding one integration at a time" section for the existing, mostly working, way to add integrations.

If you have a favorite setup, you can recreate it without having to provide any interactive input:

```sh
# NOTE: This is not implemented yet.
npm init --yes @svelte-add/vite@latest -- --with bulma+mdsvex
```

## 🧩 Adding one integration at a time

Ideally, you can `svelte-add` an integration any time after app initialization:

```sh
# Suppose you started a SvelteKit project
npm init svelte@next

# Then realized you want to write your styles in PostCSS
npx svelte-add@latest postcss
```

but there are practically infinite scenarios that an automated tool like this cannot expect, so it doesn't always work. For that reason, we recommend choosing integrations with the appropriate app initializer (SvelteKit or Vite) for an instant result and [creating an issue for an eventual fix](https://github.com/svelte-add/svelte-add/issues).

Adders should all be _composable_, meaning that it should always be possible to run one after another without something breaking:

```sh
npx svelte-add@latest Leftium/coffeescript-adder
npx svelte-add@latest mdsvex
# CoffeeScript should still work
```

## 🧓 Support for Elder.js

No adders currently support Elder.js, but we would like to! If you can help, see [the open issue for it](https://github.com/svelte-add/svelte-add/issues/42).

## 🧭 Support for Routify

No adders currently support Routify. If you can help `svelte-add` support Routify, [create an issue to talk about it](https://github.com/svelte-add/svelte-add/issues).

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
- Read this repository's open issues to talk about [ideas for new adders](https://github.com/svelte-add/svelte-add/issues?q=is%3Aissue+is%3Aopen+label%3A%22wait+for+big+rewrite+before+making+a+new+adder%22).
- Create a [pull request](https://github.com/svelte-add/svelte-add/pulls) to add your adder to the external integration adders list. Most !

### Setup

- `git clone --recurse-submodules https://github.com/svelte-add/svelte-add` (make sure to clone submodules)
- `pnpm install` (make sure that you have installed `pnpm` before, see https://pnpm.io/installation#using-npm)
- Get started coding

## 📄 License

MIT

## 🙏 Attribution

`svelte-add` takes inspiration from existing projects:

- [`snowpack-start`](https://github.com/awu43/snowpack-start)
- [`stackmix`](https://github.com/roxiness/stackmix)
- [`use-preset`](https://usepreset.dev/)

_Repository preview image generated with [GitHub Social Preview](https://social-preview.pqt.dev/)_

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
