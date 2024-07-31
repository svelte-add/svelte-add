import { defineAdderOptions } from '@svelte-add/core';

export const options = defineAdderOptions({
	availableLanguageTags: {
		question: 'Which language tags would you like to support?',
		type: 'string',
		default: 'en',
	},
});

export const isValidLanguageTag = (languageTag: string): boolean =>
	RegExp(
		'^((?<grandfathered>(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))|((?<language>([A-Za-z]{2,3}(-(?<extlang>[A-Za-z]{3}(-[A-Za-z]{3}){0,2}))?))(-(?<script>[A-Za-z]{4}))?(-(?<region>[A-Za-z]{2}|[0-9]{3}))?(-(?<variant>[A-Za-z0-9]{5,8}|[0-9][A-Za-z0-9]{3}))*))$',
	).test(languageTag);

export function parseLanguageTagInput(input: string): {
	validLanguageTags: string[];
	invalidLanguageTags: string[];
} {
	const probablyLanguageTags = input
		.replace(/[,:\s]/g, ' ') //replace common separators with spaces
		.split(' ')
		.filter(Boolean) //remove empty segments
		.map((tag) => tag.toLowerCase());

	const validLanguageTags: string[] = [];
	const invalidLanguageTags: string[] = [];

	for (const tag of probablyLanguageTags) {
		if (isValidLanguageTag(tag)) validLanguageTags.push(tag);
		else invalidLanguageTags.push(tag);
	}

	return {
		validLanguageTags,
		invalidLanguageTags,
	};
}
