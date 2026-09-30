import type { Result } from "../../types/tool";

export type CaseConverterInput = Readonly<{ text: string }>;

/**
 * Manual parser for this tool's input shape.
 *
 * @example
 * ```ts
 * parseCaseConverterInput({ text: "hi" }).ok; // true
 * parseCaseConverterInput({ text: 1 }).error.code; // "invalid_input"
 * ```
 */
export function parseCaseConverterInput(value: unknown): Result<CaseConverterInput> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Input must be an object." },
		};
	}
	const text = (value as { readonly text?: unknown }).text;
	if (typeof text !== "string") {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Text must be a string." },
		};
	}
	return { ok: true, value: { text } };
}
