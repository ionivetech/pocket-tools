import type { Result } from "../../types/tool";

export const PASSWORD_LENGTH_MIN = 4;
export const PASSWORD_LENGTH_MAX = 128;

export type PasswordGeneratorInput = Readonly<{
	length: number;
	lower: boolean;
	upper: boolean;
	digits: boolean;
	symbols: boolean;
	excludeAmbiguous: boolean;
}>;

/**
 * Manual parser for this tool's input shape.
 *
 * @example
 * ```ts
 * parsePasswordGeneratorInput({ length: 16, lower: true, upper: true, digits: true, symbols: false, excludeAmbiguous: true }).ok; // true
 * parsePasswordGeneratorInput({ length: "long" }).error.code; // "invalid_input"
 * ```
 */
export function parsePasswordGeneratorInput(value: unknown): Result<PasswordGeneratorInput> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Input must be an object." },
		};
	}
	const record = value as {
		readonly length?: unknown;
		readonly lower?: unknown;
		readonly upper?: unknown;
		readonly digits?: unknown;
		readonly symbols?: unknown;
		readonly excludeAmbiguous?: unknown;
	};
	if (
		typeof record.length !== "number" ||
		!Number.isInteger(record.length) ||
		record.length < PASSWORD_LENGTH_MIN ||
		record.length > PASSWORD_LENGTH_MAX
	) {
		return {
			ok: false,
			error: {
				code: "invalid_input",
				message: `Length must be a whole number from ${PASSWORD_LENGTH_MIN} to ${PASSWORD_LENGTH_MAX}.`,
			},
		};
	}
	return {
		ok: true,
		value: {
			length: record.length,
			lower: record.lower === true,
			upper: record.upper === true,
			digits: record.digits === true,
			symbols: record.symbols === true,
			excludeAmbiguous: record.excludeAmbiguous === true,
		},
	};
}
