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
 * Cleans up whitespace, lines, markup, and case, then counts the result.
 * Transform order is fixed (markup → whitespace → trim → line filters → case)
 * so combined options behave predictably.
 *
 * @example
 * ```ts
 * runTextCleaner({ text: "  Hello   World  ", trim: true, collapseWhitespace: true, caseTransform: "upper" });
 * ```
 */
export function runTextCleaner(input: TextCleanerInput): Result<TextCleanerOutput> {
	const ending = input.lineEnding ?? "keep";
	const targetEnding =
		ending === "crlf" ? "\r\n" : ending === "lf" ? "\n" : detectEnding(input.text);

	let result = input.text;

	if (input.stripHtml === true) {
		result = result.replace(/<[^>]*>/g, "");
	}
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

	// Split on any newline style; the output ending is applied once at the end.
	let lines = result.split(/\r\n|\r|\n/);
	if (input.removeEmptyLines === true) {
		lines = lines.filter((line) => line.trim() !== "");
	}
	if (input.removeDuplicateLines === true) {
		const seen = new Set<string>();
		lines = lines.filter((line) => {
			if (seen.has(line)) {
				return false;
			}
			seen.add(line);
			return true;
		});
	}
	result = lines.join(targetEnding);

	result = applyCase(result, input.caseTransform);

	return { ok: true, value: { result, counts: countText(result) } };
}

/**
 * Detects the dominant newline style (`\r\n` wins on any occurrence),
 * falling back to `\n` for single-line or empty text.
 *
 * @example
 * ```ts
 * detectEnding("a\r\nb"); // "\r\n"
 * ```
 */
export function detectEnding(text: string): "\n" | "\r\n" {
	return text.includes("\r\n") ? "\r\n" : "\n";
}

/**
 * Labels a word count as an estimated reading time at 200 words per minute.
 *
 * @example
 * ```ts
 * readingTimeLabel(400); // "2 min read"
 * readingTimeLabel(30); // "under a min read"
 * ```
 */
export function readingTimeLabel(words: number): string {
	if (words <= 0) {
		return "nothing to read yet";
	}
	const minutes = words / 200;
	if (minutes < 1) {
		return "under a min read";
	}
	const rounded = Math.round(minutes);
	return `${rounded} min read`;
}
