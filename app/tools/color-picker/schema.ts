import type { Result } from "../../types/tool";

export type ColorPickerInput = Readonly<{ color: string }>;

/**
 * Manual parser for this tool's input shape.
 *
 * @example
 * ```ts
 * parseColorPickerInput({ color: "#1d4ed8" }).ok; // true
 * parseColorPickerInput({ color: 1 }).error.code; // "invalid_input"
 * ```
 */
export function parseColorPickerInput(value: unknown): Result<ColorPickerInput> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Input must be an object." },
		};
	}
	const color = (value as { readonly color?: unknown }).color;
	if (typeof color !== "string") {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Color must be a string." },
		};
	}
	return { ok: true, value: { color } };
}
