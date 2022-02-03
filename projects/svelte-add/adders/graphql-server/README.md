<h1 align="center">🕸 Add (out of date) GraphQL server to Svelte</h1>

This is an adder for `svelte-add`; you should [read its `README`](https://github.com/svelte-add/svelte-add#readme) before continuing here.

## ➕ Adding (out of date) GraphQL server

This adder's codename is `graphql-server`, and can be used like so:

```sh
npx svelte-add@latest graphql-server
```

### 🏞 Supported environments

This adder only supports SvelteKit.

### ⚙️ Options

This adder doesn't take any options of its own.

## 🛠 Using (out of date) GraphQL server

After the adder runs,

- You can create a GraphQL schema in `src/graphql/schema.ts` using any library or technique you want. Additionally, you can set the `defaultQuery` that shows up when GraphiQL is loaded in the browser.

- You can query your API (with POST requests) at the /graphql endpoint.

- You can visit GraphiQL in the browser at the /graphql endpoint.

- You can see an example of how you may set up resolver-level authorization with the `contextFactory` line in `src/routes/graphql.ts` and the `authorization` argument in `src/graphql/schema.ts`.

- The `/` page (in your `src/routes/index.svelte` file) will show an example of how to use your GraphQL API in `load`.

- You [_cannot_ use GraphQL subscriptions](https://github.com/svelte-add/graphql/issues/1).
