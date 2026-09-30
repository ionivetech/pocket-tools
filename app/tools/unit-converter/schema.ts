import type { Result } from "../../types/tool";

export type UnitConverterInput = Readonly<{
	amount: number;
	from: string;
	to: string;
}>;

/**
 * Manual parser for this tool's input shape.
 *
 * @example
 * ```ts
 * parseUnitConverterInput({ amount: 1, from: "km", to: "m" }).ok; // true
 * parseUnitConverterInput({ amount: "lots" }).error.code; // "invalid_input"
 * ```
 */
export function parseUnitConverterInput(value: unknown): Result<UnitConverterInput> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Input must be an object." },
		};
	}
	const record = value as {
		readonly amount?: unknown;
		readonly from?: unknown;
		readonly to?: unknown;
	};
	if (
		typeof record.amount !== "number" ||
		typeof record.from !== "string" ||
		typeof record.to !== "string"
	) {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Amount must be a number, units must be text." },
		};
	}
	return { ok: true, value: { amount: record.amount, from: record.from, to: record.to } };
}
