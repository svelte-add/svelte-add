
<p align="center">
    <img src="https://svelte-add.com/adder/bootstrap/logo.svg" height="50" />
</p>

# Bootstrap

> This is a adder for [svelte-add](https://svelte-add.com) and is used to add Bootstrap to your svelte/kit project.

You can find all options for this adder on [this site](https://svelte-add.com/adder/bootstrap). We will only provide a short breakdown of the adder features here.

Basic usage
```sh
npx @svelte-add/bootstrap@latest
```

In case you already have a directory in mind, you can use this:
```sh
npx @svelte-add/bootstrap@latest --path ./your-project
```


## Available options (adder-specific)

    
- `useSass` (default: false) - Do you want to use sass? (css = faster, sass = better customization)
- `addJavaScript` (default: false) - Do you want to add JavaScript (required for some components like dropdowns)?


Option syntax
```sh
npx @svelte-add/bootstrap@latest --key value
```

Specific example
```sh
npx @svelte-add/bootstrap@latest --useSass false
```

You can combine as many options as you want. The usage of options is optional. If you don't specify an option value via the command line, the CLI will ask you the questions interactively.



## Available options (common)

    
- `default` (default: false) - Installs default adder options for unspecified options
- `path` (default: ./) - Path to working directory
- `skip-preconditions` (default: false) - Skips validating preconditions before running the adder
- `skip-install` (default: false) - Skips installing dependencies after applying the adder


Option syntax
```sh
npx @svelte-add/bootstrap@latest --key value
```

Specific example
```sh
npx @svelte-add/bootstrap@latest --path ./
```

You can combine as many options as you want. The usage of options is optional. If you don't specify an option value via the command line, the CLI will ask you the questions interactively.

