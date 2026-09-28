import type { Result } from "../../types/tool";
import type { UuidGeneratorInput } from "./schema";

export type UuidGeneratorOutput = Readonly<{ summary: string }>;

/**
 * Empty-state contract for this tool.
 *
 * The scaffold ships no tool algorithm on purpose. Implement the real
 * behaviour here and return a genuine `Result` instead of a fake success.
 *
 * @example
 * ```ts
 * runUuidGenerator({ text: "" }).error.code; // "not_implemented"
 * ```
 */
export function runUuidGenerator(input: UuidGeneratorInput): Result<UuidGeneratorOutput> {
	void input;
	return {
		ok: false,
		error: {
			code: "not_implemented",
			message: "UUID/ULID generator has no working logic yet.",
		},
	};
}
