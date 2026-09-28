import type { Result } from "../../types/tool";

export type JsonFormatterIndent = 2 | 4 | "tab";
export type JsonFormatterMode = "format" | "minify";

export type JsonFormatterInput = Readonly<{
	text: string;
	indent: JsonFormatterIndent;
	mode: JsonFormatterMode;
}>;

const indentValues = [2, 4, "tab"] as const;
const modeValues = ["format", "minify"] as const satisfies readonly JsonFormatterMode[];

export function isJsonFormatterIndent(value: unknown): value is JsonFormatterIndent {
	return (indentValues as readonly unknown[]).includes(value);
}

export function isJsonFormatterMode(value: unknown): value is JsonFormatterMode {
	return (modeValues as readonly unknown[]).includes(value);
}

/**
 * Validates the JSON formatter's input shape: the raw text plus the two
 * shareable options (indent width, format vs. minify).
 *
 * @example
 * ```ts
 * parseJsonFormatterInput({ text: "{}", indent: 2, mode: "format" }).ok; // true
 * parseJsonFormatterInput({ text: "{}", indent: 3, mode: "format" }).ok; // false
 * ```
 */
export function parseJsonFormatterInput(value: unknown): Result<JsonFormatterInput> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return { ok: false, error: { code: "invalid_input", message: "Input must be an object." } };
	}

	const { text, indent, mode } = value as Record<string, unknown>;

	if (typeof text !== "string") {
		return { ok: false, error: { code: "invalid_input", message: "Text must be a string." } };
	}
	if (!isJsonFormatterIndent(indent)) {
		return {
			ok: false,
			error: { code: "invalid_input", message: 'Indent must be 2, 4, or "tab".' },
		};
	}
	if (!isJsonFormatterMode(mode)) {
		return {
			ok: false,
			error: { code: "invalid_input", message: 'Mode must be "format" or "minify".' },
		};
	}

	return { ok: true, value: { text, indent, mode } };
}
