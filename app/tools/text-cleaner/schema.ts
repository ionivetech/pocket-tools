import type { Result } from "../../types/tool";

export type TextCaseTransform = "none" | "upper" | "lower" | "title" | "sentence";

export type TextLineEnding = "keep" | "lf" | "crlf";

export type TextCleanerInput = Readonly<{
	text: string;
	trim: boolean;
	collapseWhitespace: boolean;
	caseTransform: TextCaseTransform;
	/** Drop blank lines. Optional for backwards compatibility; defaults to false. */
	removeEmptyLines?: boolean;
	/** Drop repeated lines, keeping the first occurrence. Defaults to false. */
	removeDuplicateLines?: boolean;
	/** Normalize line endings. Defaults to "keep" (dominant input style). */
	lineEnding?: TextLineEnding;
	/** Strip `<tag>` markup. Defaults to false. */
	stripHtml?: boolean;
}>;

const caseTransformValues = [
	"none",
	"upper",
	"lower",
	"title",
	"sentence",
] as const satisfies readonly TextCaseTransform[];

export function isTextCaseTransform(value: unknown): value is TextCaseTransform {
	return (caseTransformValues as readonly unknown[]).includes(value);
}

const lineEndingValues = ["keep", "lf", "crlf"] as const satisfies readonly TextLineEnding[];

export function isTextLineEnding(value: unknown): value is TextLineEnding {
	return (lineEndingValues as readonly unknown[]).includes(value);
}

/**
 * Validates the text cleaner's input shape.
 *
 * @example
 * ```ts
 * parseTextCleanerInput({ text: "hi", trim: true, collapseWhitespace: true, caseTransform: "none" }).ok; // true
 * ```
 */
export function parseTextCleanerInput(value: unknown): Result<TextCleanerInput> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return { ok: false, error: { code: "invalid_input", message: "Input must be an object." } };
	}

	const { text, trim, collapseWhitespace, caseTransform } = value as Record<string, unknown>;
	const { removeEmptyLines, removeDuplicateLines, lineEnding, stripHtml } = value as Record<
		string,
		unknown
	>;

	if (typeof text !== "string") {
		return { ok: false, error: { code: "invalid_input", message: "Text must be a string." } };
	}
	if (typeof trim !== "boolean") {
		return { ok: false, error: { code: "invalid_input", message: "Trim must be a boolean." } };
	}
	if (typeof collapseWhitespace !== "boolean") {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Collapse whitespace must be a boolean." },
		};
	}
	if (!isTextCaseTransform(caseTransform)) {
		return {
			ok: false,
			error: {
				code: "invalid_input",
				message: "Case transform is not one of the supported values.",
			},
		};
	}
	if (removeEmptyLines !== undefined && typeof removeEmptyLines !== "boolean") {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Remove empty lines must be a boolean." },
		};
	}
	if (removeDuplicateLines !== undefined && typeof removeDuplicateLines !== "boolean") {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Remove duplicate lines must be a boolean." },
		};
	}
	if (lineEnding !== undefined && !isTextLineEnding(lineEnding)) {
		return {
			ok: false,
			error: { code: "invalid_input", message: 'Line ending must be "keep", "lf", or "crlf".' },
		};
	}
	if (stripHtml !== undefined && typeof stripHtml !== "boolean") {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Strip HTML must be a boolean." },
		};
	}

	return {
		ok: true,
		value: {
			text,
			trim,
			collapseWhitespace,
			caseTransform,
			removeEmptyLines,
			removeDuplicateLines,
			lineEnding,
			stripHtml,
		},
	};
}
