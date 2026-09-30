import type { Result } from "../../types/tool";

export type CronHelperInput = Readonly<{ expression: string }>;

/**
 * Manual parser for this tool's input shape.
 *
 * @example
 * ```ts
 * parseCronHelperInput({ expression: "* * * * *" }).ok; // true
 * parseCronHelperInput({ expression: 1 }).error.code; // "invalid_input"
 * ```
 */
export function parseCronHelperInput(value: unknown): Result<CronHelperInput> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Input must be an object." },
		};
	}
	const expression = (value as { readonly expression?: unknown }).expression;
	if (typeof expression !== "string") {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Expression must be a string." },
		};
	}
	return { ok: true, value: { expression } };
}
