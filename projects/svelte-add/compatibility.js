import { createRequire } from "module";
const require = createRequire(import.meta.url);

/**
 * @param {object} param0
 * @param {string[]} param0.args
 * @param {string} param0.preset
 * @param {string} param0.index
 * @param {string} param0.node
 * @return {void} 
 */
export const applyPreset = ({ args, preset, index, node }) => {
    if (!args.includes("--no-ssh")) args = [...args, "--no-ssh"];

    process.argv = [node, index, preset, ...args];

    const run = "apply/bin/run";
    delete require.cache[require.resolve(run)];
    require(run);
};
