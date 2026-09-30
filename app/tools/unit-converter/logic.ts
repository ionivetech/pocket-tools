import type { Result } from "../../types/tool";
import {
	convertUnits,
	listUnitCategories,
	listUnits,
	type UnitCategory,
} from "../../utils/unit-tables";
import { parseUnitConverterInput, type UnitConverterInput } from "./schema";

export type UnitConverterOutput = Readonly<{
	amount: number;
	from: string;
	to: string;
	value: number;
	category: UnitCategory;
	formula: string;
}>;

export { listUnitCategories, listUnits };
export type { UnitCategory };

/**
 * Converts an amount between units of one category, with a human formula line
 * for the UI ("1 km = 1000 m").
 *
 * @example
 * ```ts
 * runUnitConverter({ amount: 1, from: "km", to: "m" }).value.formula; // "1 km = 1000 m"
 * ```
 */
export function runUnitConverter(input: UnitConverterInput): Result<UnitConverterOutput> {
	const validated = parseUnitConverterInput(input);
	if (!validated.ok) {
		return validated;
	}
	const { amount, from, to } = validated.value;
	const converted = convertUnits(amount, from, to);
	if (!converted.ok) {
		return converted;
	}
	return {
		ok: true,
		value: {
			amount,
			from,
			to,
			value: converted.value.value,
			category: converted.value.category,
			formula: `${amount} ${from} = ${converted.value.value} ${to}`,
		},
	};
}
