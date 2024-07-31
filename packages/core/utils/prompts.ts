import {
	cancel,
	intro,
	isCancel,
	outro,
	select,
	text,
	multiselect,
	note,
	groupMultiselect,
} from '@svelte-add/clack-prompts';

type Primitive = Readonly<string | boolean | number>;
export type PromptOption<Value> = Value extends Primitive
	? {
			value: Value;
			label?: string;
			hint?: string;
		}
	: {
			value: Value;
			label: string;
			hint?: string;
		};

export function startPrompts(message: string) {
	intro(message);
}

export function endPrompts(message: string) {
	outro(message);
}

export async function booleanPrompt(question: string, initialValue: boolean) {
	return selectPrompt(question, initialValue, [
		{ label: 'Yes', value: true },
		{ label: 'No', value: false },
	]);
}

export async function selectPrompt<T>(
	question: string,
	initialValue: T,
	options: PromptOption<T>[],
) {
	const value = await select({
		message: question,
		options,
		initialValue,
	});

	return cancelIfRequired(value);
}

export async function textPrompt(
	question: string,
	placeholder: string = '',
	initialValue: string = '',
	validate?: (value: string) => string | undefined,
) {
	const value = await text({
		message: question,
		placeholder,
		initialValue,
		validate,
	});

	const result = cancelIfRequired(value);
	return result;
}

export async function multiSelectPrompt<T>(question: string, options: PromptOption<T>[]) {
	const value = await multiselect<T>({
		message: question,
		options,
		required: false,
	});

	return cancelIfRequired(value);
}

export async function groupedMultiSelectPrompt<T>(
	question: string,
	options: Record<string, PromptOption<T>[]>,
) {
	const value = await groupMultiselect<T>({
		message: question,
		options,
		required: false,
		selectableGroups: false,
		spacedGroups: true,
	});

	return cancelIfRequired(value);
}

export function messagePrompt(title: string, content: string) {
	note(content, title);
}

function cancelIfRequired<T>(value: T): T extends symbol ? never : T {
	if (typeof value === 'symbol' || isCancel(value)) {
		cancel('Operation cancelled.');
		process.exit(0);
	}

	// @ts-expect-error hacking it to never return a symbol. there's probably a better way, but this works for now.
	return value;
}
