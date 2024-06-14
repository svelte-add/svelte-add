
<p align="center">
    <img src="https://svelte-add.com/adder/drizzle/logo.svg" height="50" />
</p>

# Drizzle

> This is a adder for [svelte-add](https://svelte-add.com) and is used to add Drizzle to your svelte/kit project.

You can find all options for this adder on [this site](https://svelte-add.com/adder/drizzle). We will only provide a short breakdown of the adder features here.

Basic usage
```sh
npx @svelte-add/drizzle@latest
```

In case you already have a directory in mind, you can use this:
```sh
npx @svelte-add/drizzle@latest --path ./your-project
```


## Available options (adder-specific)

    
- `database` (default: sqlite) - Which database would you like to use?
- `postgresql` (default: undefined) - Which PostgreSQL client would you like to use?
- `mysql` (default: undefined) - Which MySQL client would you like to use?
- `sqlite` (default: undefined) - Which SQLite client would you like to use?
- `docker` (default: false) - Do you want to run the database locally with docker-compose?


Option syntax
```sh
npx @svelte-add/drizzle@latest --key value
```

Specific example
```sh
npx @svelte-add/drizzle@latest --database sqlite
```

You can combine as many options as you want. The usage of options is optional. If you don't specify an option value via the command line, the CLI will ask you the questions interactively.



## Available options (common)

    
- `default` (default: false) - Installs default adder options for unspecified options
- `path` (default: ./) - Path to working directory
- `skip-preconditions` (default: false) - Skips validating preconditions before running the adder
- `skip-install` (default: false) - Skips installing dependencies after applying the adder


Option syntax
```sh
npx @svelte-add/drizzle@latest --key value
```

Specific example
```sh
npx @svelte-add/drizzle@latest --path ./
```

You can combine as many options as you want. The usage of options is optional. If you don't specify an option value via the command line, the CLI will ask you the questions interactively.

