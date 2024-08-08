import { selectPrompt } from './prompts';
import { detect } from 'package-manager-detector';
import { COMMANDS } from 'package-manager-detector/agents';
import { spinner } from '@svelte-add/clack-prompts';
import { executeCli } from './cli.js';

type PackageManager = (typeof packageManagers)[number] | undefined;
const packageManagers = ['npm', 'pnpm', 'yarn', 'bun'] as const;

/**
 * @param workingDirectory
 * @returns the install status of dependencies
 */
export async function suggestInstallingDependencies(
	workingDirectory: string,
): Promise<'installed' | 'skipped'> {
	const detectedPm = await detect({ cwd: workingDirectory });
	let selectedPm: keyof typeof COMMANDS | undefined;
	if (!detectedPm) {
		selectedPm = await selectPrompt(
			'Which package manager do you want to install dependencies with?',
			undefined,
			[
				{
					label: 'None',
					value: undefined,
				},
				...packageManagers.map((x) => {
					return { label: x, value: x as PackageManager };
				}),
			],
		);
	} else {
		selectedPm = detectedPm.agent;
	}

	if (!selectedPm || !COMMANDS[selectedPm]) {
		return 'skipped';
	}

	const selectedCommand = COMMANDS[selectedPm].install;
	const args = selectedCommand.split(' ');
	const command = args[0];
	args.splice(0, 1);

	const loadingSpinner = spinner();
	loadingSpinner.start('Installing dependencies...');
	await installDependencies(command, args, workingDirectory);
	loadingSpinner.stop('Successfully installed dependencies');
	return 'installed';
}

async function installDependencies(command: string, args: string[], workingDirectory: string) {
	try {
		await executeCli(command, args, workingDirectory);
	} catch (error) {
		const typedError = error as Error;
		throw new Error('unable to install dependencies: ' + typedError.message);
	}
}
