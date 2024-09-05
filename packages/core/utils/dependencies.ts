import { selectPrompt } from './prompts';
import { COMMANDS } from 'package-manager-detector/agents';
import { spinner } from '@svelte-add/clack-prompts';
import { executeCli } from './cli.js';

export type PackageManager = (typeof packageManagers)[number] | undefined;
const packageManagers = ['npm', 'pnpm', 'yarn', 'bun'] as const;

/**
 * @param packageManager
 * @param workingDirectory
 * @returns the install status of dependencies
 */
export async function suggestInstallingDependencies(
	packageManager: PackageManager,
	workingDirectory: string,
): Promise<'installed' | 'skipped'> {
	let selectedPm = packageManager;

	selectedPm ??= await selectPrompt(
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

	if (!selectedPm || !COMMANDS[selectedPm]) {
		return 'skipped';
	}

	await installDependencies(selectedPm, workingDirectory);

	return 'installed';
}

export async function installDependencies(
	packageManager: PackageManager,
	workingDirectory: string,
) {
	if (!packageManager) throw new Error('unable to install dependencies: No package manager found');
	try {
		const installCommand = COMMANDS[packageManager].install;
		const [pm, install] = installCommand.split(' ');

		const loadingSpinner = spinner();
		loadingSpinner.start('Installing dependencies...');

		await executeCli(pm, [install], workingDirectory);

		loadingSpinner.stop('Successfully installed dependencies');
	} catch (error) {
		const typedError = error as Error;
		throw new Error('unable to install dependencies: ' + typedError.message);
	}
}

/**
 * Supports npm, pnpm, Yarn, cnpm, bun and any other package manager that sets the
 * npm_config_user_agent env variable.
 * Thanks to https://github.com/zkochan/packages/tree/main/which-pm-runs for this code!
 */
export function getPackageManager() {
	if (!process.env.npm_config_user_agent) {
		return undefined;
	}
	const user_agent = process.env.npm_config_user_agent;
	const pm_spec = user_agent.split(' ')[0];
	const separator_pos = pm_spec.lastIndexOf('/');
	const name = pm_spec.substring(0, separator_pos);
	return (name === 'npminstall' ? 'cnpm' : name) as PackageManager;
}
