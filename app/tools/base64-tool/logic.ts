import type { Result } from "../../types/tool";
import type { Base64ToolInput } from "./schema";

export type Base64ToolOutput = Readonly<{ summary: string }>;

/**
 * Empty-state contract for this tool.
 *
 * The scaffold ships no tool algorithm on purpose. Implement the real
 * behaviour here and return a genuine `Result` instead of a fake success.
 *
 * @example
 * ```ts
 * runBase64Tool({ text: "" }).error.code; // "not_implemented"
 * ```
 */
export function runBase64Tool(input: Base64ToolInput): Result<Base64ToolOutput> {
	void input;
	return {
		ok: false,
		error: {
			code: "not_implemented",
			message: "Base64 encoder/decoder has no working logic yet.",
		},
	};
}
