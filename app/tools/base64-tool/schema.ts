import type { Result } from "../../types/tool";

export type Base64Direction = "encode" | "decode" | "auto";

export type Base64ToolInput = Readonly<{
	text: string;
	direction: Base64Direction;
}>;

const directionValues = ["encode", "decode", "auto"] as const satisfies readonly Base64Direction[];

export function isBase64Direction(value: unknown): value is Base64Direction {
	return (directionValues as readonly unknown[]).includes(value);
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

	const { text, direction } = value as Record<string, unknown>;

	if (typeof text !== "string") {
		return { ok: false, error: { code: "invalid_input", message: "Text must be a string." } };
	}
	if (!isBase64Direction(direction)) {
		return {
			ok: false,
			error: { code: "invalid_input", message: 'Direction must be "encode", "decode", or "auto".' },
		};
	}

	return { ok: true, value: { text, direction } };
}
