module.exports = {
    /**
     * @param {object} param0
     * @param {string[]} param0.args
     * @param {string} param0.adder
     * @param {string} param0.index
     * @param {string} param0.node
     * @return {void} 
     */
    applyPreset({ args, adder, index, node }) {
        if (!adder.includes("/")) adder = `svelte-add/${adder}`;
        if (!args.includes("--no-ssh")) args = [...args, "--no-ssh"];

        process.argv = [node, index, adder, ...args];

        require("apply/bin/run");
    }
};
