import type { Result } from "../../types/tool";

export type ImageResizerInput = Readonly<{ text: string }>;

/**
 * Manual parser for this tool's input shape.
 *
 * @example
 * ```ts
 * parseImageResizerInput({ text: "hello" }).ok; // true
 * parseImageResizerInput({ text: 1 }).error.code; // "invalid_input"
 * ```
 */
export function parseImageResizerInput(value: unknown): Result<ImageResizerInput> {
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
