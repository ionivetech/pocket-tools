import { describe, expect, test } from "bun:test";
import { convertUnits, listUnitCategories } from "../../app/utils/unit-tables";

describe("unit-tables", () => {
	test("converts km to m", () => {
		expect(convertUnits(1, "km", "m")).toMatchObject({ ok: true, value: { value: 1000 } });
	});

	test("converts Celsius to Fahrenheit", () => {
		expect(convertUnits(0, "C", "F")).toMatchObject({ ok: true, value: { value: 32 } });
		expect(convertUnits(100, "C", "K")).toMatchObject({ ok: true, value: { value: 373.15 } });
	});

	test("returns the same value for identical units", () => {
		expect(convertUnits(5, "kg", "kg")).toMatchObject({ ok: true, value: { value: 5 } });
	});

	test("rejects incompatible categories with a code", () => {
		expect(convertUnits(1, "km", "kg")).toMatchObject({
			ok: false,
			error: { code: "incompatible_units" },
		});
	});

	test("rejects unknown units and non-finite amounts", () => {
		expect(convertUnits(1, "parsec", "m")).toMatchObject({
			ok: false,
			error: { code: "unknown_unit" },
		});
		expect(convertUnits(Number.NaN, "m", "km")).toMatchObject({
			ok: false,
			error: { code: "invalid_amount" },
		});
	});

	test("lists categories for building the UI pickers", () => {
		const categories = listUnitCategories();
		expect(categories).toContain("length");
		expect(categories).toContain("temperature");
	});
});
