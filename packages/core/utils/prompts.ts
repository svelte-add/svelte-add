import { cancel, intro, isCancel, outro, select, text, multiselect } from "@clack/prompts";

export type PromptOption = {
    label: string;
    value: boolean | string;
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
        { label: "Yes", value: true },
        { label: "No", value: false },
    ]);
}

export async function selectPrompt(question: string, initialValue: boolean | string, options: PromptOption[]) {
    const value = await select({
        message: question,
        options,
        initialValue: initialValue,
    });

    return cancelIfRequired(value) as string | boolean;
}

export async function textPrompt(question: string, placeholder: string = "", initialValue: string = "") {
    const value = await text({
        message: question,
        placeholder,
        initialValue,
    });

    const result = cancelIfRequired(value) as string;
    return result;
}

export async function multiSelectPrompt(question: string, options: PromptOption[]) {
    const value = (await multiselect({
        message: question,
        options,
        required: false,
    })) as unknown as string;

    return cancelIfRequired(value) as string[];
}

function cancelIfRequired(value: string | string[] | boolean | symbol) {
    if (typeof value == "symbol" || isCancel(value)) {
        cancel("Operation cancelled.");
        process.exit(0);
    }

    return value;
}
