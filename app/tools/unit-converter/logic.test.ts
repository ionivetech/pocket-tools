import { describe, expect, test } from "bun:test";
import { runUnitConverter } from "./logic";
import { parseUnitConverterInput } from "./schema";

describe("unit-converter", () => {
	test("rejects a non-number amount", () => {
		expect(parseUnitConverterInput({ amount: "lots" })).toMatchObject({
			ok: false,
			error: { code: "invalid_input" },
		});
	});

	test("converts with a formula line", () => {
		const result = runUnitConverter({ amount: 1, from: "km", to: "m" });
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.value).toBe(1000);
		expect(result.value.formula).toBe("1 km = 1000 m");
	});

	test("passes incompatible units through with codes", () => {
		expect(runUnitConverter({ amount: 1, from: "km", to: "kg" })).toMatchObject({
			ok: false,
			error: { code: "incompatible_units" },
		});
	});
});
