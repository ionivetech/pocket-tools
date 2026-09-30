import type { Result } from "../../types/tool";

export type CurlConverterInput = Readonly<{ command: string }>;

/**
 * Manual parser for this tool's input shape.
 *
 * @example
 * ```ts
 * parseCurlConverterInput({ command: "curl https://x.test" }).ok; // true
 * parseCurlConverterInput({ command: 1 }).error.code; // "invalid_input"
 * ```
 */
export function parseCurlConverterInput(value: unknown): Result<CurlConverterInput> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Input must be an object." },
		};
	}
	const command = (value as { readonly command?: unknown }).command;
	if (typeof command !== "string") {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Command must be a string." },
		};
	}
	return { ok: true, value: { command } };
}
