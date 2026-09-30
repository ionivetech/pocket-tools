import type { Result } from "../../types/tool";

export const REGEX_FLAGS = ["d", "g", "i", "m", "s", "u", "y"] as const;
export type RegexFlag = (typeof REGEX_FLAGS)[number];

export const REGEX_PATTERN_MAX = 500;
export const REGEX_SAMPLE_MAX = 20000;

export type RegexTesterInput = Readonly<{
	pattern: string;
	flags: string;
	sample: string;
}>;

/**
 * Manual parser for this tool's input shape. Flags are letters only; unknown
 * letters fail loudly instead of being dropped.
 *
 * @example
 * ```ts
 * parseRegexTesterInput({ pattern: "a+", flags: "gi", sample: "Aa" }).ok; // true
 * parseRegexTesterInput({ pattern: "a", flags: "z", sample: "" }).error.code; // "invalid_input"
 * ```
 */
export function parseRegexTesterInput(value: unknown): Result<RegexTesterInput> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Input must be an object." },
		};
	}
	const record = value as {
		readonly pattern?: unknown;
		readonly flags?: unknown;
		readonly sample?: unknown;
	};
	if (
		typeof record.pattern !== "string" ||
		typeof record.flags !== "string" ||
		typeof record.sample !== "string"
	) {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Pattern, flags and sample must be strings." },
		};
	}
	if (!/^[dgimsuy]*$/.test(record.flags)) {
		return {
			ok: false,
			error: {
				code: "invalid_input",
				message: `Flags may only use ${REGEX_FLAGS.join(", ")}.`,
			},
		};
	}
	return {
		ok: true,
		value: { pattern: record.pattern, flags: record.flags, sample: record.sample },
	};
}
