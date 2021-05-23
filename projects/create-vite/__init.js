import { spawn } from "child_process";

/**
 * 
 * @param {Object} param0 
 * @param {string} param0.dir
 * @param {string} param0.packageManager
 */
export const fresh = async ({ dir, packageManager }) => {
    // TODO: finish
    const process = spawn(`${packageManager} init @vitejs/app ${dir}`, {
        stdio: "pipe",
    });
}
