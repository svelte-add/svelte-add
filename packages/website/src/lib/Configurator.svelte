<script>
    import Box from "./Box.svelte";
    import CopyCommand from "./CopyCommand.svelte";

    /** @type {import("./adder").AdderMetadataWithOptions[]} */
    export let adders = [];

    /** @type {import("@svelte-add/core/internal").AvailableCliOptions} */
    export let availableCliOptions;

    /** @type {any} */
    const selectedOptions = {};
    let command = "";

    $: generateCommandArgs(selectedOptions);
    $: prepareDefaultValues(adders);

    /**
     *
     * @param {any} args
     */
    function generateCommandArgs(args) {
        const argumentEntries = Object.entries(args);
        const multipleAdders = argumentEntries.length > 1;
        const firstAdderId = Object.keys(args)[0];

        command = "npx ";
        if (!firstAdderId) {
            command += "svelte-add@latest";
            return;
        }

        if (!multipleAdders) command += "@svelte-add/" + firstAdderId + "@latest";
        else {
            const adderIds = Object.keys(args).join(" ");
            command += `svelte-add@latest --adder ${adderIds}`;
        }

        for (const [adderId, options] of argumentEntries) {
            for (const [key, optionValue] of Object.entries(options)) {
                if (multipleAdders) {
                    command += ` --${adderId}-${key} ${optionValue}`;
                } else {
                    command += ` --${key} ${optionValue}`;
                }
            }
        }
    }

    /**
     * Prepares the default values for each adder and deletes values
     * for adders that are not present anymore
     * @param {import("./adder").AdderMetadataWithOptions[]} adders
     */
    function prepareDefaultValues(adders) {
        // Once a adders has been added and an option values that differs
        // from the default value has been chosen we are not allowed to
        // update the adders anymore, as this would destroy the users choice.
        // That's why we need to determine the newly added and old removed values
        // and only update the appropriate properties

        const presentAdderIds = Object.keys(selectedOptions);
        const updatedAdderIds = adders.map((x) => x.metadata.id);
        const newValues = updatedAdderIds.filter((x) => !presentAdderIds.includes(x));
        const oldValues = presentAdderIds.filter((x) => !updatedAdderIds.includes(x));
        const newAdders = adders.filter((x) => newValues.includes(x.metadata.id));

        // delete option values for adders that are not present anymore
        for (const oldValue of oldValues) {
            delete selectedOptions[oldValue];
        }

        // Set default property values of new adders
        for (const { metadata, options } of newAdders) {
            if (!selectedOptions[metadata.id]) selectedOptions[metadata.id] = {};

            if (!options) continue;

            for (const [key, value] of Object.entries(options)) {
                selectedOptions[metadata.id][key] = value.default;
            }
        }

        generateCommandArgs(selectedOptions);
    }
</script>

<h1 class="text-xl">Configurator</h1>
<p>
    You can select one or multiple adders and we will ask you questions for each adder. At the end we generate one cli command for
    you, that you can execute in your project. Otherwise you can use the cli interactively.
</p>

<Box>
    {#each adders as { metadata, options }}
        <div class="font-bold underline">{metadata.name}</div>
        {#if options && Object.entries(options).length > 0}
            {#each Object.entries(options) as [key, value]}
                <div>
                    <span class="w-2/3 inline-block">{value.question}</span>

                    {#if value.type == "boolean"}
                        <label>
                            <input type="radio" value={true} bind:group={selectedOptions[metadata.id][key]} />
                            Yes
                        </label>
                        <label>
                            <input type="radio" value={false} bind:group={selectedOptions[metadata.id][key]} />
                            No
                        </label>
                    {:else if value.type == "number"}
                        <input type="number" bind:value={selectedOptions[metadata.id][key]} />
                    {:else if value.type == "string"}
                        <input type="text" bind:value={selectedOptions[metadata.id][key]} />
                    {/if}
                </div>
            {/each}
        {:else}
            <p>This adder does not have any options.</p>
        {/if}
        <hr />
    {/each}

    {#if !adders || adders.length == 0}
        <p>You have not selected any adders, but you can still use the cli interactively.</p>
    {/if}

    <CopyCommand {command} />

    <div>
        There is a number of options that apply for all adders, that you can add as you like:
        <ul>
            {#each Object.values(availableCliOptions) as cliOption}
                <li class="option">
                    <span class="option-command">--{cliOption.cliArg}</span>
                    (default: {cliOption.default}) {cliOption.description}
                </li>
            {/each}
        </ul>
    </div>
</Box>

<style>
    .option {
        margin: 0.5rem 0;
    }

    .option-command {
        background-color: var(--dark-grey);
        padding: 0.2rem 0.3rem;
        border-radius: 0.5rem;
    }
</style>
