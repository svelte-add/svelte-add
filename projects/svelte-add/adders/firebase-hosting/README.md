<h1 align="center">🔥 Add (out of date) Firebase Hosting to Svelte</h1>

This is an adder for `svelte-add`; you should [read its `README`](https://github.com/svelte-add/svelte-add#readme) before continuing here.

## ➕ Adding (out of date) Firebase Hosting

This adder's codename is `firebase-hosting`, and can be used like so:

```sh
npx svelte-add@latest firebase-hosting
```

### 🏞 Supported environments

This adder supports SvelteKit and Vite-powered Svelte apps (all the environments `svelte-add` currently supports).

### ⚙️ Options

- `project` (default ``): ignore this - it doesn't get used yet

## 🛠 Using (out of date) Firebase Hosting

After the adder runs,

- [You _cannot_ use server-side rendering](https://github.com/svelte-add/firebase-hosting/issues/1). Your site must be static. This means that, among other things, [`svelte-add/graphql-server`](https://github.com/svelte-add/graphql-server) is currently not suitable to be hosted on Firebase.

- Consider setting up GitHub Actions for automatic building and deployment to Firebase.

  Start by generating [a CI login token from Firebase](https://firebase.google.com/docs/cli#cli-ci-systems):

  ```sh
  npm run firebase login:ci
  ```

  Then, go to your repository's [Settings > Secrets](https://docs.github.com/en/free-pro-team@latest/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository). Copy the result of the command above and [save it as a Secret](https://docs.github.com/en/free-pro-team@latest/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository) named `FIREBASE_TOKEN`.

  You can test if it's working by making a commit to `main` or `master` and checking the Actions tab of your repository to see if your project successfully builds and deploys to Firebase.

- You can create a custom 404 page at `src/routes/404.svelte`.

- You can use the `deploy` package script to manually deploy the site after a `build`.
