<h1 align="center">➕ Svelte Adders</h1>

## ❓ What is this?
This is a community project of commands to add particular functionality to Svelte projects.

They are all *composable*, meaning that it should always be possible to run one after running any other command without something breaking (ideally). This should put an end to the boilerplate problem: too much or too little is included.

## 🧰 SvelteKit
[SvelteKit is an alpha project now](https://svelte.dev/blog/whats-the-deal-with-sveltekit), but work is starting now so that there are good integrations for when it enters beta.

* [**svelte-add/bulma**](https://github.com/svelte-add/bulma): Add Bulma to your SvelteKit project

* [**svelte-add/firebase-hosting**](https://github.com/svelte-add/firebase-hosting): Add hosting on Firebase to your SvelteKit project

* [**svelte-add/graphql**](https://github.com/svelte-add/graphql): Add a GraphQL server to your SvelteKit project

* [**svelte-add/mdsvex**](https://github.com/svelte-add/mdsvex): Add mdsvex to your SvelteKit project

* [**svelte-add/postcss**](https://github.com/svelte-add/postcss): Add PostCSS to your SvelteKit project

* [**svelte-add/tailwindcss**](https://github.com/svelte-add/tailwindcss): Add Tailwind CSS to your SvelteKit project

### 💡 Example
To migrate from [`sapper-firebase-typescript-graphql-tailwindcss-actions-template`](https://github.com/babichjacob/sapper-firebase-typescript-graphql-tailwindcss-actions-template) to SvelteKit, these commands can be run to recreate all the functionality:

```sh
# Use the official SvelteKit template
npm init svelte@next  # Say yes to TypeScript preprocessing and select plain CSS

npx svelte-add postcss
npx svelte-add tailwindcss

npx svelte-add graphql

npx svelte-add firebase-hosting
# Actually, there's a limitation for right now that server functions like a GraphQL server
# aren't supported by svelte-add/firebase-hosting, but that could be solved later!
```

So, to exclude a feature you weren't using that was still included in the boilerplate anyway, *don't* run its corresponding command. Suppose you only wanted PostCSS and to host on Firebase, then drop the `tailwindcss` and `graphql` additions.

## ⚡️ Vite
Some Svelte Adders also work for Svelte projects using Vite without SvelteKit:

* [**svelte-add/mdsvex**](https://github.com/svelte-add/mdsvex): Add mdsvex to your Vite-powered Svelte app

* [**svelte-add/postcss**](https://github.com/svelte-add/postcss): Add PostCSS to your Vite-powered Svelte app

* [**svelte-add/tailwindcss**](https://github.com/svelte-add/postcss): Add Tailwind CSS to your Vite-powered Svelte app

## 🗑 Excluding examples
To demonstrate how the functionality they add works, most adders include examples you might not need if you're already familiar with the tool involved. You can give the `--exclude-examples` option to the adder command to keep things minimal:

```sh
npx svelte-add mdsvex --exclude-examples
```

Or you can delete the extra files after the fact.

## 🎁 Contributing
This is a community project! Here are some ways you can help:
* Battle test (combinations of) adders to make sure they're always composable and find other edge cases, bugs, etc.
* Fix known issues and missing features in an adder per the open issues on its repository.
* Read [this repository's open issues](https://github.com/svelte-add/svelte-adders/issues) to talk about ideas for new adders.
* If you're ready to make a new adder, try using an existing adder's repository as a template [and change it up to make it add the functionality you want](https://usepreset.dev/).
* Create a [pull request](https://github.com/svelte-add/svelte-adders/pulls) to add your project to this list.

---

*Repository preview image generated with [GitHub Social Preview](https://social-preview.pqt.dev/)*

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
