<h1 align="center">➕ Svelte Adders</h1>

## ❓ What is this?
This is a community project of commands to add particular functionality to Svelte projects.

They are all *composable*, meaning that it should always be possible to run one after running any other command without something breaking (ideally). This should put an end to the boilerplate problem: too much or too little is included.

## 🧰 SvelteKit
[SvelteKit is an alpha project now](https://svelte.dev/blog/whats-the-deal-with-sveltekit), but work is starting now so that there are good integrations for when it enters beta.

* [**svelte-add-firebase-hosting**](https://github.com/babichjacob/svelte-add-firebase-hosting): Add hosting on Firebase to your SvelteKit project

* [**svelte-add-graphql**](https://github.com/babichjacob/svelte-add-graphql): Add a GraphQL server to your SvelteKit project

* [**svelte-add-postcss**](https://github.com/babichjacob/svelte-add-postcss): Add PostCSS to your SvelteKit project

* [**svelte-add-tailwindcss**](https://github.com/babichjacob/svelte-add-tailwindcss): Add TailwindCSS to your SvelteKit project

*Create an [issue](https://github.com/babichjacob/svelte-adders/issues) or [pull request](https://github.com/babichjacob/svelte-adders/pulls) to add your project to this list or brainstorm ideas for a new one.*

## 💡 Example
To migrate from [`sapper-firebase-typescript-graphql-tailwindcss-actions-template`](https://github.com/babichjacob/sapper-firebase-typescript-graphql-tailwindcss-actions-template) to SvelteKit, these commands can be run to recreate all the functionality:

```sh
# Use the official SvelteKit template
npm init svelte@next  # Say yes to TypeScript preprocessing

npx use-preset babichjacob/svelte-add-postcss
npx use-preset babichjacob/svelte-add-tailwindcss

npx use-preset babichjacob/svelte-add-graphql

npx use-preset babichjacob/svelte-add-firebase-hosting
# Actually, there's a limitation for right now that server functions like a GraphQL server
# aren't supported by svelte-add-firebase-hosting, but that could be solved later!
```

So, to exclude a feature you weren't using that was still included in the boilerplate anyway, *don't* run its corresponding command. Suppose you only wanted PostCSS and to host on Firebase, then drop the `svelte-add-tailwindcss` and `svelte-add-graphql` commands.

---

*Repository preview image generated with [GitHub Social Preview](https://social-preview.pqt.dev/)*

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
