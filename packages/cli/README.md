# svelte-add

> This is the main cli for [svelte-add](https://svelte-add.com) and is used to add different tools to your svelte/kit project.

You can find all available adders and their respective options on [this site](https://svelte-add.com/adder/bootstrap). We will only provide a short breakdown of the cli features here.

Basic usage (fully interactive)

```sh
npx svelte-add@latest
```

In case you already have a directory in mind, you can use this:

```sh
npx svelte-add@latest --path ./your-project
```

If you want to install multiple adders at once, you can use this command:

```sh
npx svelte-add@latest tailwindcss mdsvex
```

You can also directly pass through options for each adder. Please refer to the [website](https://svelte-add.com) to generate such commands. Alternatively you can refer to the individual adder options.
