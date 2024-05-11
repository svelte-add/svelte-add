import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import terminate from "terminate";

export async function startDevServer(
    output: string,
    command: string,
): Promise<{ url: string; devServer: ChildProcessWithoutNullStreams }> {
    return await new Promise((resolve) => {
        const devServerProcess = spawn("pnpm", ["run", command], { stdio: "inherit", shell: true, cwd: output });
        devServerProcess.stdout?.on("data", async (data) => {
            const value = data.toString();

            const regexUnicode = /[^\x20-\xaf]+/g;
            const withoutUnicode = value.replace(regexUnicode, "");

            const regexUnicodeDigits = /\[[0-9]{1,2}m/g;
            const withoutColors = withoutUnicode.replace(regexUnicodeDigits, "");

            const regexUrl = /http:\/\/[^:\s]+:[0-9]+\//g;
            const urls = withoutColors.match(regexUrl);

            if (urls && urls.length > 0) {
                const url = urls[0];
                resolve({ url, devServer: devServerProcess });
            }
        });
    });
}

export async function stopDevServer(devServer: ChildProcessWithoutNullStreams) {
    if (!devServer.pid) return;

    await forceKill(devServer);
}

async function forceKill(devServer: ChildProcessWithoutNullStreams): Promise<void> {
    return new Promise((resolve) => {
        // just killing the process was not enough, because the process itself
        // spawns child process, that also need to be killed!
        terminate(devServer.pid, () => {
            resolve();
        });
    });
}
