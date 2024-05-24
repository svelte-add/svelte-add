import { parseJson } from "@svelte-add/ast-tooling";
import { commonFilePaths, readFile } from "../files/utils.js";
import type { WorkspaceWithoutExplicitArgs } from "./workspace.js";
import { type ChildProcess, spawn } from "child_process";
import { error } from "console";

export type Package = {
    name: string;
    version: string;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
};

export async function getPackageJson(workspace: WorkspaceWithoutExplicitArgs) {
    const packageText = await readFile(workspace, commonFilePaths.packageJsonFilePath);
    if (!packageText) {
        return {
            text: "",
            data: {
                dependencies: {},
                devDependencies: {},
                name: "",
                version: "",
            },
        };
    }

    const packageJson: Package = parseJson(packageText);
    return {
        text: packageText,
        data: packageJson,
    };
}

export async function executeCli(
    command: string,
    commandArgs: string[],
    cwd: string,
    options?: {
        onData?: (data: string, program: ChildProcess, resolve: (value: any) => any) => void;
        stdio?: "pipe" | "inherit";
        env?: Record<string, string>;
    },
): Promise<void | any> {
    const stdio = options?.stdio ?? "pipe";
    const env = options?.env ?? process.env;

    const program = spawn(command, commandArgs, { stdio, shell: true, cwd, env });

    return await new Promise((resolve, reject) => {
        let errorText = "";
        program.stderr?.on("data", (data) => {
            const value = data.toString();
            errorText += value;
        });

        program.stdout?.on("data", (data) => {
            const value = data.toString();
            options?.onData?.(value, program, resolve);
        });

        program.on("exit", (code) => {
            if (code == 0) {
                resolve(undefined);
            } else {
                reject(errorText);
            }
        });
    });
}

export function groupBy<Key, Value>(list: Value[], keyGetter: (input: Value) => Key) {
    const map = new Map<Key, Value[]>();
    list.forEach((item) => {
        const key = keyGetter(item);
        const collection = map.get(key);
        if (!collection) {
            map.set(key, [item]);
        } else {
            collection.push(item);
        }
    });
    return map;
}
