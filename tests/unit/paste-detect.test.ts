import { describe, expect, test } from "bun:test";
import { detectPasteTools } from "../../app/utils/paste-detect";

describe("detectPasteTools", () => {
	test("suggests JSON formatter for JSON", () => {
		expect(detectPasteTools('{"name":"pocket"}')[0]?.toolSlug).toBe("json-formatter");
	});

	test("suggests Base64 helper for encoded text", () => {
		expect(detectPasteTools("aGVsbG8td29ybGQtdGVzdA==")[0]?.toolSlug).toBe("base64-tool");
	});

	test("suggests UUID tool for identifiers", () => {
		expect(detectPasteTools("550e8400-e29b-41d4-a716-446655440000")[0]?.toolSlug).toBe(
			"uuid-generator",
		);
	});

	test("suggests color helper for hex", () => {
		expect(detectPasteTools("#1d4ed8")[0]?.toolSlug).toBe("color-picker");
	});

	test("ignores short generic text", () => {
		expect(detectPasteTools("hello")).toEqual([]);
		expect(detectPasteTools("   ")).toEqual([]);
	});
});
