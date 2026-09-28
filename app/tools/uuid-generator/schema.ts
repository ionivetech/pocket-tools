import type { Result } from "../../types/tool";

export type UuidGeneratorInput = Readonly<{ text: string }>;

/**
 * Manual parser for this tool's input shape.
 *
 * @example
 * ```ts
 * parseUuidGeneratorInput({ text: "hello" }).ok; // true
 * parseUuidGeneratorInput({ text: 1 }).error.code; // "invalid_input"
 * ```
 */
export function parseUuidGeneratorInput(value: unknown): Result<UuidGeneratorInput> {
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
