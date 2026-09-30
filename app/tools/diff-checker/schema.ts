import type { Result } from "../../types/tool";

export type DiffCheckerInput = Readonly<{
	original: string;
	changed: string;
	ignoreWhitespace: boolean;
}>;

/**
 * Manual parser for this tool's input shape.
 *
 * @example
 * ```ts
 * parseDiffCheckerInput({ original: "a", changed: "b", ignoreWhitespace: false }).ok; // true
 * parseDiffCheckerInput({ original: 1 }).error.code; // "invalid_input"
 * ```
 */
export function parseDiffCheckerInput(value: unknown): Result<DiffCheckerInput> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Input must be an object." },
		};
	}
	const record = value as {
		readonly original?: unknown;
		readonly changed?: unknown;
		readonly ignoreWhitespace?: unknown;
	};
	if (typeof record.original !== "string" || typeof record.changed !== "string") {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Both texts must be strings." },
		};
	}
	return {
		ok: true,
		value: {
			original: record.original,
			changed: record.changed,
			ignoreWhitespace: record.ignoreWhitespace === true,
		},
	};
}
