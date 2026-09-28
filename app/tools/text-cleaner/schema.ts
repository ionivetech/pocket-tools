import type { Result } from "../../types/tool";

export type TextCaseTransform = "none" | "upper" | "lower" | "title" | "sentence";

export type TextCleanerInput = Readonly<{
	text: string;
	trim: boolean;
	collapseWhitespace: boolean;
	caseTransform: TextCaseTransform;
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

	return { ok: true, value: { text, trim, collapseWhitespace, caseTransform } };
}
