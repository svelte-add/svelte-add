import { spawn, type ChildProcess } from 'child_process';

export async function executeCli(
	command: string,
	commandArgs: string[],
	cwd: string,
	options?: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		onData?: (data: string, program: ChildProcess, resolve: (value?: any) => any) => void;
		stdio?: 'pipe' | 'inherit';
		env?: Record<string, string>;
	},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
	const stdio = options?.stdio ?? 'pipe';
	const env = options?.env ?? process.env;

	const program = spawn(command, commandArgs, { stdio, shell: true, cwd, env });

	return await new Promise((resolve, reject) => {
		let errorText = '';
		program.stderr?.on('data', (data: Buffer) => {
			const value = data.toString();
			errorText += value;
		});

		program.stdout?.on('data', (data: Buffer) => {
			const value = data.toString();
			options?.onData?.(value, program, resolve);
		});

		program.on('exit', (code) => {
			if (code == 0) {
				resolve(undefined);
			} else {
				reject(new Error(errorText));
			}
		});
	});
}
