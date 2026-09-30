import type { Result } from "../../types/tool";

export type JwtDecoderInput = Readonly<{ token: string }>;

/**
 * Manual parser for this tool's input shape.
 *
 * @example
 * ```ts
 * parseJwtDecoderInput({ token: "a.b.c" }).ok; // true
 * parseJwtDecoderInput({ token: 1 }).error.code; // "invalid_input"
 * ```
 */
export function parseJwtDecoderInput(value: unknown): Result<JwtDecoderInput> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Input must be an object." },
		};
	}

	const token = (value as { readonly token?: unknown }).token;
	if (typeof token !== "string") {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Token must be a string." },
		};
	}

	return { ok: true, value: { token } };
}
