import { selectPrompt } from './prompts';
import { detect } from 'package-manager-detector';
import { COMMANDS } from 'package-manager-detector/agents';
import { spinner } from '@svelte-add/clack-prompts';
import { executeCli } from './cli.js';

export type PackageManager = (typeof packageManagers)[number];
const packageManagers = ['npm', 'pnpm', 'yarn', 'bun'] as const;

/**
 * @param workingDirectory
 * @returns the package manager
 */
export async function selectPackageManager(
	workingDirectory: string,
): Promise<PackageManager | undefined> {
	const detectedPm = await detect({ cwd: workingDirectory });
	let pm = normalizePackageManager(detectedPm.agent);

	if (!pm) {
		pm = await selectPrompt(
			'Which package manager do you want to install dependencies with?',
			undefined,
			[
				{
					label: 'None',
					value: undefined,
				},
				...packageManagers.map((x) => {
					return { label: x, value: x };
				}),
			],
		);
	}

	return pm;
}

/**
 * @param packageManager
 * @param workingDirectory
 * @returns the install status of dependencies
 */
export async function suggestInstallingDependencies(
	packageManager: PackageManager | undefined,
	workingDirectory: string,
): Promise<'installed' | 'skipped'> {
	if (!packageManager || !COMMANDS[packageManager]) {
		return 'skipped';
	}

	const loadingSpinner = spinner();
	loadingSpinner.start('Installing dependencies...');

	const installCommand = COMMANDS[packageManager].install;
	const [pm, install] = installCommand.split(' ');
	await installDependencies(pm, [install], workingDirectory);

	loadingSpinner.stop('Successfully installed dependencies');
	return 'installed';
}

export async function installDependencies(
	command: string,
	args: string[],
	workingDirectory: string,
) {
	try {
		await executeCli(command, args, workingDirectory);
	} catch (error) {
		const typedError = error as Error;
		throw new Error('unable to install dependencies: ' + typedError.message);
	}
}

function normalizePackageManager(pm: string | undefined): PackageManager | undefined {
	if (pm === 'yarn@berry' || pm === 'yarn') return 'yarn';
	if (pm === 'pnpm@6' || pm === 'pnpm') return 'pnpm';
	return pm as PackageManager;
}
