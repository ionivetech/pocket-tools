import { describe, expect, test } from "bun:test";
import { encodeQr, type QrErrorCorrection } from "../../app/utils/qr-encode";

function finderAt(modules: readonly (readonly boolean[])[], row: number, col: number): boolean[] {
	const pattern = [
		[true, true, true, true, true, true, true],
		[true, false, false, false, false, false, true],
		[true, false, true, true, true, false, true],
		[true, false, true, true, true, false, true],
		[true, false, true, true, true, false, true],
		[true, false, false, false, false, false, true],
		[true, true, true, true, true, true, true],
	];
	const seen: boolean[] = [];
	for (let r = 0; r < 7; r += 1) {
		for (let c = 0; c < 7; c += 1) {
			seen.push(modules[row + r]?.[col + c] === pattern[r]?.[c]);
		}
	}
	return seen;
}

describe("qr-encode", () => {
	test("encodes a short text to version 1 (21x21)", () => {
		const result = encodeQr("hi", "M");
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.size).toBe(21);
		expect(result.value.modules).toHaveLength(21);
	});

	test("carries correct finder patterns in three corners", () => {
		const result = encodeQr("hello qr", "M");
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		const { modules, size } = result.value;
		expect(finderAt(modules, 0, 0).every(Boolean)).toBe(true);
		expect(finderAt(modules, 0, size - 7).every(Boolean)).toBe(true);
		expect(finderAt(modules, size - 7, 0).every(Boolean)).toBe(true);
	});

	test("is deterministic for the same input", () => {
		const first = encodeQr("https://example.com/a", "M");
		const second = encodeQr("https://example.com/a", "M");
		expect(first).toEqual(second);
	});

	test("rejects empty input and oversized payloads with codes", () => {
		expect(encodeQr("", "M")).toMatchObject({ ok: false, error: { code: "empty_input" } });
		expect(encodeQr("x".repeat(500), "M")).toMatchObject({
			ok: false,
			error: { code: "too_long" },
		});
	});

	test("reports the exact version for a fixed payload", () => {
		// Versions must be pinned to values, not to a range: a range assertion
		// passes for any implementation, including a broken one.
		expect(encodeQr("hi", "M")).toMatchObject({ ok: true, value: { version: 1, size: 21 } });
		expect(encodeQr("a".repeat(60), "M")).toMatchObject({ ok: true, value: { version: 4 } });
	});

	test("reports its version and ecc back for UI labels", () => {
		const result = encodeQr("version check", "M");
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		const ecc: QrErrorCorrection = result.value.ecc;
		expect(ecc).toBe("M");
		expect(result.value.version).toBeGreaterThanOrEqual(1);
		expect(result.value.version).toBeLessThanOrEqual(6);
	});
});
