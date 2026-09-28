import type { Result } from "../../types/tool";
import type { TextCleanerInput } from "./schema";

export type TextCleanerCounts = Readonly<{
	words: number;
	characters: number;
	charactersNoSpaces: number;
	lines: number;
}>;

export type TextCleanerOutput = Readonly<{
	result: string;
	counts: TextCleanerCounts;
}>;

const wordPattern = /\S+/g;

function applyCase(text: string, transform: TextCleanerInput["caseTransform"]): string {
	switch (transform) {
		case "upper":
			return text.toUpperCase();
		case "lower":
			return text.toLowerCase();
		case "title":
			return text.replace(
				/\S+/g,
				(word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
			);
		case "sentence":
			return text.toLowerCase().replace(/(^\s*\S|[.!?]\s+\S)/g, (match) => match.toUpperCase());
		case "none":
		default:
			return text;
	}
}

/**
 * Counts words, characters (with and without whitespace), and lines. Pure
 * and independent of any cleanup transform, so the UI can show live counts
 * for the input as well as the cleaned result.
 *
 * @example
 * ```ts
 * countText("hello world\nsecond line"); // { words: 4, characters: 23, ... }
 * ```
 */
export function countText(text: string): TextCleanerCounts {
	const words = text.match(wordPattern)?.length ?? 0;
	const characters = [...text].length;
	const charactersNoSpaces = [...text].filter((char) => !/\s/.test(char)).length;
	const lines = text === "" ? 0 : text.split("\n").length;

	return { words, characters, charactersNoSpaces, lines };
}

/**
 * Cleans up whitespace and case, then counts the result.
 *
 * @example
 * ```ts
 * runTextCleaner({ text: "  Hello   World  ", trim: true, collapseWhitespace: true, caseTransform: "upper" });
 * ```
 */
export function runTextCleaner(input: TextCleanerInput): Result<TextCleanerOutput> {
	let result = input.text;

	if (input.collapseWhitespace) {
		// Collapse runs of horizontal whitespace, but keep line breaks so
		// paragraph structure survives a "clean up spacing" pass.
		result = result.replace(/[^\S\n]+/g, " ").replace(/\n{3,}/g, "\n\n");
	}
	if (input.trim) {
		result = result
			.split("\n")
			.map((line) => line.trim())
			.join("\n")
			.trim();
	}

	result = applyCase(result, input.caseTransform);

	return { ok: true, value: { result, counts: countText(result) } };
}
