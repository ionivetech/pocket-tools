import { describe, expect, test } from "bun:test";
import { jsonDiagnostics, lineColToOffset } from "./json-diagnostics";

describe("jsonDiagnostics", () => {
	test("returns no diagnostics for valid JSON", () => {
		expect(jsonDiagnostics('{"a":1}')).toEqual([]);
	});

	test("returns no diagnostics for empty input", () => {
		expect(jsonDiagnostics("   ")).toEqual([]);
	});

	test("maps the parser error to line, column, and message", () => {
		const diagnostics = jsonDiagnostics('{\n  "a": 1,\n}');
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]?.line).toBe(3);
		expect(typeof diagnostics[0]?.message).toBe("string");
	});
});

describe("lineColToOffset", () => {
	test("converts a 1-based position to an offset", () => {
		expect(lineColToOffset("ab\ncde", 2, 2)).toBe(4);
		expect(lineColToOffset("ab\ncde", 1, 1)).toBe(0);
	});

	test("clamps wild positions onto the document", () => {
		expect(lineColToOffset("ab", 99, 99)).toBe(2);
		expect(lineColToOffset("ab", 0, 0)).toBe(0);
	});
});
