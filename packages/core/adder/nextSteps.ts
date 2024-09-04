import { messagePrompt } from '../utils/prompts';
import type { InlineAdderConfig } from './config';
import type { AdderDetails, AddersExecutionPlan } from './execute';
import type { OptionDefinition, OptionValues } from './options';
import pc from 'picocolors';

export function displayNextSteps<Args extends OptionDefinition>(
	adderDetails: AdderDetails<Args>[],
	multipleAdders: boolean,
	executionPlan: AddersExecutionPlan,
) {
	const allAddersMessage = adderDetails
		.filter((x) => x.config.integrationType == 'inline' && x.config.nextSteps)
		.map((x) => x.config as InlineAdderConfig<Args>)
		.map((x) => {
			// only doing this to narrow the type, `nextSteps` should already exist here
			if (!x.nextSteps) return '';
			const metadata = x.metadata;
			let adderMessage = '';
			if (multipleAdders) {
				adderMessage = `${pc.green(metadata.name)}:\n`;
			}

			const options = executionPlan.cliOptionsByAdderId[x.metadata.id] as OptionValues<Args>;

			const adderNextSteps = x.nextSteps({
				options,
				cwd: executionPlan.workingDirectory,
				colors: pc,
				docs: x.metadata.website?.documentation,
			});
			adderMessage += `- ${adderNextSteps.join('\n- ')}`;
			return adderMessage;
		})
		.join('\n\n');
	if (allAddersMessage) messagePrompt('Next steps', allAddersMessage);
}
