import { describe, expect, test } from "bun:test";
import { runQrGenerator, toQrSvg } from "./logic";
import { parseQrGeneratorInput } from "./schema";

const LINK = "https://pockettools.app/tools/json-formatter";

describe("qr-generator", () => {
	test("rejects an unsupported error correction level", () => {
		expect(parseQrGeneratorInput({ text: "hi", ecc: "H" })).toMatchObject({
			ok: false,
			error: { code: "invalid_input" },
		});
	});

	test("encodes a link into an SVG with a quiet zone", () => {
		const result = runQrGenerator({ text: LINK, ecc: "M" });
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.svg.startsWith("<svg")).toBe(true);
		// 44 bytes fits version 4 (25 + 2 * 4 quiet zone would be 33 modules).
		expect(result.value.version).toBe(4);
		expect(result.value.size).toBe(33);
		expect(result.value.svg).toContain('viewBox="0 0 41 41"');
		expect(result.value.bytes).toBe(new TextEncoder().encode(LINK).length);
	});

	test("grows the version with payload length", () => {
		const short = runQrGenerator({ text: "hi", ecc: "M" });
		const long = runQrGenerator({ text: "x".repeat(100), ecc: "M" });
		expect(short.ok && long.ok).toBe(true);
		if (!short.ok || !long.ok) return;
		expect(long.value.version).toBeGreaterThan(short.value.version);
	});

	test("svg path omits light modules", () => {
		const svg = toQrSvg([
			[true, false],
			[false, true],
		]);
		expect(svg).toContain("M4 4h1v1h-1z");
		expect(svg).toContain("M5 5h1v1h-1z");
		expect(svg.match(/M4 4|M5 5/g)).toHaveLength(2);
	});

	test("names empty and over-long input with codes", () => {
		expect(runQrGenerator({ text: "", ecc: "M" })).toMatchObject({
			ok: false,
			error: { code: "empty_input" },
		});
		expect(runQrGenerator({ text: "x".repeat(500), ecc: "M" })).toMatchObject({
			ok: false,
			error: { code: "too_long" },
		});
	});
});
