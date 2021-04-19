<h1 align="center">➕ Svelte Add</h1>

## ❓ What is this?

This is a community project of commands to add particular functionality to Svelte projects.

They are all _composable_, meaning that it should always be possible to run one after running any other command without something breaking (ideally). This should put an end to the boilerplate problem: too much or too little is included.

## 🧰 SvelteKit

- [**svelte-add/bulma**](https://github.com/svelte-add/bulma): Add Bulma to your SvelteKit project

- [**leftium/coffeescript-adder**](https://github.com/Leftium/coffeescript-adder): Add CoffeeScript to your SvelteKit project

- [**svelte-add/graphql**](https://github.com/svelte-add/graphql): Add a GraphQL server to your SvelteKit project

- [**svelte-add/mdsvex**](https://github.com/svelte-add/mdsvex): Add mdsvex to your SvelteKit project

- [**svelte-add/postcss**](https://github.com/svelte-add/postcss): Add PostCSS to your SvelteKit project

- [**leftium/pug-adder**](https://github.com/Leftium/pug-adder): Add Pug to your SvelteKit project

- [**joshnuss/svelte-supabase**](https://github.com/joshnuss/svelte-supabase): Add Supabase to your SvelteKit project

- [**svelte-add/tailwindcss**](https://github.com/svelte-add/tailwindcss): Add Tailwind CSS to your SvelteKit project

### 💡 Example

To migrate from [`sapper-firebase-typescript-graphql-tailwindcss-actions-template`](https://github.com/babichjacob/sapper-firebase-typescript-graphql-tailwindcss-actions-template) to SvelteKit, these commands can be run to recreate all the functionality:

```sh
# Use the official SvelteKit template
npm init svelte@next  # Say yes to TypeScript preprocessing and select plain CSS

npx svelte-add tailwindcss

npx svelte-add graphql

npx svelte-add firebase-hosting
# Actually, there's a limitation for right now that server functions like a GraphQL server
# aren't supported by svelte-add/firebase-hosting, but that could be solved later!
```

So, to exclude a feature you weren't using that was still included in the boilerplate anyway, _don't_ run its corresponding command. Suppose you only wanted PostCSS and to host on Firebase, then drop the `graphql` addition and replace `tailwindcss` with `postcss`.

## ⚡️ Vite

Some Svelte Adders also work for Svelte projects using Vite without SvelteKit:

- [**svelte-add/mdsvex**](https://github.com/svelte-add/mdsvex): Add mdsvex to your Vite-powered Svelte app

- [**svelte-add/postcss**](https://github.com/svelte-add/postcss): Add PostCSS to your Vite-powered Svelte app

- [**svelte-add/tailwindcss**](https://github.com/svelte-add/tailwindcss): Add Tailwind CSS to your Vite-powered Svelte app


## 🗑 Excluding examples

To demonstrate how the functionality they add works, most adders include examples you might not need if you're already familiar with the tool involved. You can give the `--exclude-examples` option to the adder command to keep things minimal:

```sh
npx svelte-add mdsvex --exclude-examples
```

Or you can delete the extra files after the fact.

## 🎁 Contributing

This is a community project! Here are some ways you can help:

- Battle test (combinations of) adders to make sure they're always composable and find other edge cases, bugs, etc.
- Fix known issues and missing features in an adder per the open issues on its repository.
- Read [this repository's open issues](https://github.com/svelte-add/svelte-add/issues) to talk about [ideas for new adders](https://github.com/svelte-add/svelte-add/issues?q=is%3Aissue+is%3Aopen+label%3A%22make+a+new+adder%22).
- Create a [pull request](https://github.com/svelte-add/svelte-add/pulls) to add your project to this list.

---

_Repository preview image generated with [GitHub Social Preview](https://social-preview.pqt.dev/)_

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
