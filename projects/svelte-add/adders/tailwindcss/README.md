<h1 align="center">💨 Add Tailwind CSS to Svelte</h1>

This is an adder for `svelte-add`; you should [read its `README`](https://github.com/svelte-add/svelte-add#readme) before continuing here.

## ➕ Adding Tailwind CSS
This adder's codename is `tailwindcss`, and can be used like so:
```sh
npx svelte-add tailwindcss
```

### 🏞 Supported environments
This adder supports SvelteKit and Vite-powered Svelte apps (all the environments `svelte-add` currently supports).

### ⚙️ Options
* `jit`: whether or not to use [Tailwind Just-in-Time Mode](https://tailwindcss.com/docs/just-in-time-mode)

## 🛠 Using Tailwind CSS
After the adder runs,
* You can use Tailwind utility classes like `bg-blue-700` in the markup (components, routes, `app.html`).

* You can use [Tailwind directives like `@apply` and `@screen` or use the `theme` function](https://tailwindcss.com/docs/functions-and-directives) in Svelte `style` blocks or the `src/app.postcss` file.

* You can [configure Tailwind](https://tailwindcss.com/docs/configuration) in the `tailwind.config.cjs` file.

* Your Tailwind CSS will be purged for production builds.
