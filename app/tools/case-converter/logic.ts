import type { Result } from "../../types/tool";
import { parseCaseConverterInput, type CaseConverterInput } from "./schema";

export type CaseVariant = Readonly<{
	id: string;
	label: string;
	value: string;
}>;

export type CaseConverterOutput = Readonly<{ variants: readonly CaseVariant[] }>;

function wordsOf(text: string): string[] {
	return text
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.split(/[\s\-_]+/)
		.filter((word) => word.length > 0);
}

function capitalize(word: string): string {
	return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Converts text into every common case at once, so the UI lists all variants
 * with their own copy buttons instead of hiding them behind a picker.
 *
 * @example
 * ```ts
 * runCaseConverter({ text: "hello world" }).value.variants[1]?.value; // "HELLO WORLD"
 * runCaseConverter({ text: "" }).error.code; // "empty_input"
 * ```
 */
export function runCaseConverter(input: CaseConverterInput): Result<CaseConverterOutput> {
	const validated = parseCaseConverterInput(input);
	if (!validated.ok) {
		return validated;
	}
	const { text } = validated.value;
	if (text.trim() === "") {
		return {
			ok: false,
			error: { code: "empty_input", message: "Type some text to convert it." },
		};
	}
	const words = wordsOf(text);
	const lowered = words.map((word) => word.toLowerCase());
	const sentence = text
		.toLowerCase()
		.replace(/(^\s*[a-z])|([.!?]\s+[a-z])/g, (match) => match.toUpperCase());
	const variants: CaseVariant[] = [
		{ id: "lower", label: "lowercase", value: lowered.join(" ") },
		{ id: "upper", label: "UPPERCASE", value: lowered.join(" ").toUpperCase() },
		{ id: "title", label: "Title Case", value: lowered.map(capitalize).join(" ") },
		{ id: "sentence", label: "Sentence case", value: sentence },
		{
			id: "camel",
			label: "camelCase",
			value: lowered.map((word, index) => (index === 0 ? word : capitalize(word))).join(""),
		},
		{ id: "snake", label: "snake_case", value: lowered.join("_") },
		{ id: "kebab", label: "kebab-case", value: lowered.join("-") },
	];
	return { ok: true, value: { variants } };
}
