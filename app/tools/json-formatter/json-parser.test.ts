import { describe, expect, test } from "bun:test";
import { parseJsonWithLocation } from "./json-parser";

describe("parseJsonWithLocation", () => {
	test.each([
		['"hello"', "hello"],
		["42", 42],
		["-3.5e2", -350],
		["true", true],
		["false", false],
		["null", null],
		["[1,2,3]", [1, 2, 3]],
		['{"a":{"b":[true,null,"c"]}}', { a: { b: [true, null, "c"] } }],
		['"line1\\nline2"', "line1\nline2"],
		['"\\u00e9"', "é"],
	])("parses %s", (input, expected) => {
		expect(parseJsonWithLocation(input)).toEqual({ ok: true, value: expected });
	});

	test("rejects an empty string", () => {
		expect(parseJsonWithLocation("")).toMatchObject({ ok: false, error: { line: 1, column: 1 } });
	});

	test("rejects an unterminated string", () => {
		const result = parseJsonWithLocation('"abc');
		expect(result.ok).toBe(false);
	});

	test("rejects an unquoted object key", () => {
		expect(parseJsonWithLocation("{a:1}")).toMatchObject({
			ok: false,
			error: { line: 1, column: 2 },
		});
	});

	test("rejects a missing comma between array items", () => {
		expect(parseJsonWithLocation("[1 2]").ok).toBe(false);
	});

	test("rejects an invalid escape character", () => {
		expect(parseJsonWithLocation('"\\q"').ok).toBe(false);
	});

	test("rejects a control character inside a string", () => {
		expect(parseJsonWithLocation('"a\tb"').ok).toBe(false);
	});

	test("rejects a leading zero followed by more digits", () => {
		// "01" parses as the number 0 followed by trailing content "1".
		expect(parseJsonWithLocation("01")).toMatchObject({ ok: false });
	});

	test("rejects trailing content after a complete value", () => {
		expect(parseJsonWithLocation("{} extra")).toMatchObject({
			ok: false,
			error: { message: expect.stringContaining("trailing") },
		});
	});

	test("treats __proto__ as an ordinary own key, matching JSON.parse", () => {
		const result = parseJsonWithLocation('{"__proto__":{"polluted":true},"a":1}');
		expect(result.ok).toBe(true);
		if (result.ok) {
			// A naive `obj[key] = value` assignment would invoke the `__proto__` accessor
			// instead of creating an own property, silently rewriting this object's prototype
			// and dropping the key. Real `JSON.parse` does not do that, and neither should this.
			expect(Object.getPrototypeOf(result.value)).toBe(Object.prototype);
			expect(Object.keys(result.value as object)).toEqual(["__proto__", "a"]);
			expect(JSON.parse(JSON.stringify(result.value))).toEqual(
				JSON.parse('{"__proto__":{"polluted":true},"a":1}'),
			);
		}
	});

	test("tracks line numbers across newlines", () => {
		const result = parseJsonWithLocation('{\n  "a": 1,\n  "b": ,\n}');
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.line).toBe(3);
		}
	});
});
