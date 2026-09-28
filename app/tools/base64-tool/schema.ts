import type { Result } from "../../types/tool";

export type Base64Direction = "encode" | "decode" | "auto";

export type Base64WrapAt = 0 | 64 | 76;

export type Base64Newline = "lf" | "crlf";

export type Base64ToolInput = Readonly<{
	text: string;
	direction: Base64Direction;
	/** Emit base64url (`-_` alphabet, no padding). Optional; defaults to false. */
	urlSafe?: boolean;
	/** Wrap encoded output at this column. Optional; defaults to 0 (off). */
	wrapAt?: Base64WrapAt;
	/** Newline style for wrapping. Optional; defaults to "lf". */
	newline?: Base64Newline;
}>;

const directionValues = ["encode", "decode", "auto"] as const satisfies readonly Base64Direction[];

export function isBase64Direction(value: unknown): value is Base64Direction {
	return (directionValues as readonly unknown[]).includes(value);
}

const wrapAtValues = [0, 64, 76] as const satisfies readonly Base64WrapAt[];

export function isBase64WrapAt(value: unknown): value is Base64WrapAt {
	return (wrapAtValues as readonly unknown[]).includes(value);
}

const newlineValues = ["lf", "crlf"] as const satisfies readonly Base64Newline[];

export function isBase64Newline(value: unknown): value is Base64Newline {
	return (newlineValues as readonly unknown[]).includes(value);
}

/**
 * Validates the Base64 tool's input shape.
 *
 * @example
 * ```ts
 * parseBase64ToolInput({ text: "hi", direction: "encode" }).ok; // true
 * ```
 */
export function parseBase64ToolInput(value: unknown): Result<Base64ToolInput> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return { ok: false, error: { code: "invalid_input", message: "Input must be an object." } };
	}

	const { text, direction, urlSafe, wrapAt, newline } = value as Record<string, unknown>;

	if (typeof text !== "string") {
		return { ok: false, error: { code: "invalid_input", message: "Text must be a string." } };
	}
	if (!isBase64Direction(direction)) {
		return {
			ok: false,
			error: { code: "invalid_input", message: 'Direction must be "encode", "decode", or "auto".' },
		};
	}
	if (urlSafe !== undefined && typeof urlSafe !== "boolean") {
		return {
			ok: false,
			error: { code: "invalid_input", message: "URL-safe must be a boolean." },
		};
	}
	if (wrapAt !== undefined && !isBase64WrapAt(wrapAt)) {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Wrap width must be 0, 64, or 76." },
		};
	}
	if (newline !== undefined && !isBase64Newline(newline)) {
		return {
			ok: false,
			error: { code: "invalid_input", message: 'Newline must be "lf" or "crlf".' },
		};
	}

	return { ok: true, value: { text, direction, urlSafe, wrapAt, newline } };
}
