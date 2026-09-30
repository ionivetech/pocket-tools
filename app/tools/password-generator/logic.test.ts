import { describe, expect, test } from "bun:test";
import { runPasswordGenerator } from "./logic";
import { parsePasswordGeneratorInput } from "./schema";

const FULL = {
	length: 32,
	lower: true,
	upper: true,
	digits: true,
	symbols: true,
	excludeAmbiguous: true,
} as const;

describe("password-generator", () => {
	test("rejects a non-number length value", () => {
		expect(parsePasswordGeneratorInput({ length: "long" })).toMatchObject({
			ok: false,
			error: { code: "invalid_input" },
		});
	});

	test("generates the requested length from the allowed alphabet", () => {
		const result = runPasswordGenerator({ ...FULL, length: 16 });
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.password).toHaveLength(16);
		expect(result.value.password).toMatch(/^[a-zA-Z0-9!@#$%^&*()\-_=+[\]{};:,.<>?]+$/);
	});

	test("represents every selected set, structurally", () => {
		for (let run = 0; run < 5; run += 1) {
			const result = runPasswordGenerator({ ...FULL, length: 12 });
			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.password).toMatch(/[a-z]/);
			expect(result.value.password).toMatch(/[A-Z]/);
			expect(result.value.password).toMatch(/[0-9]/);
		}
	});

	test("excludes ambiguous characters on request", () => {
		for (let run = 0; run < 5; run += 1) {
			const result = runPasswordGenerator({ ...FULL, length: 64 });
			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.password).not.toMatch(/[lIO01|]/);
		}
	});

	test("labels strength from entropy and requires a set", () => {
		const weak = runPasswordGenerator({ ...FULL, length: 4, symbols: false });
		expect(weak.ok).toBe(true);
		if (!weak.ok) return;
		expect(weak.value.strength).toBe("weak");
		expect(
			runPasswordGenerator({
				length: 16,
				lower: false,
				upper: false,
				digits: false,
				symbols: false,
				excludeAmbiguous: false,
			}),
		).toMatchObject({ ok: false, error: { code: "no_sets" } });
	});
});
