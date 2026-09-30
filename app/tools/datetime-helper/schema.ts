import type { Result } from "../../types/tool";

export const DATETIME_MODES = ["timestamp", "iso"] as const;
export type DatetimeMode = (typeof DATETIME_MODES)[number];

export type DatetimeHelperInput = Readonly<{
	value: string;
	mode: DatetimeMode;
}>;

function isMode(value: unknown): value is DatetimeMode {
	return typeof value === "string" && (DATETIME_MODES as readonly string[]).includes(value);
}

/**
 * Manual parser for this tool's input shape.
 *
 * @example
 * ```ts
 * parseDatetimeHelperInput({ value: "0", mode: "timestamp" }).ok; // true
 * parseDatetimeHelperInput({ value: 1 }).error.code; // "invalid_input"
 * ```
 */
export function parseDatetimeHelperInput(value: unknown): Result<DatetimeHelperInput> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Input must be an object." },
		};
	}
	const record = value as { readonly value?: unknown; readonly mode?: unknown };
	if (typeof record.value !== "string" || !isMode(record.mode)) {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Value must be text and mode timestamp or iso." },
		};
	}
	return { ok: true, value: { value: record.value, mode: record.mode } };
}
