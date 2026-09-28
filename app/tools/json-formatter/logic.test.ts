import { describe, expect, test } from "bun:test";
import { getJsonStats, runJsonFormatter, sortJsonKeys, validateJson } from "./logic";
import { isJsonFormatterIndent, isJsonFormatterMode, parseJsonFormatterInput } from "./schema";

describe("json-formatter schema", () => {
	test("accepts a valid record", () => {
		expect(parseJsonFormatterInput({ text: "{}", indent: 2, mode: "format" })).toEqual({
			ok: true,
			value: { text: "{}", indent: 2, mode: "format" },
		});
	});

	test.each([2, 4, "tab"])("accepts indent %p", (indent) => {
		expect(isJsonFormatterIndent(indent)).toBe(true);
	});

	test("rejects an unsupported indent", () => {
		expect(isJsonFormatterIndent(3)).toBe(false);
	});

	test.each(["format", "minify"])("accepts mode %p", (mode) => {
		expect(isJsonFormatterMode(mode)).toBe(true);
	});

	test("rejects a non-string text value", () => {
		expect(parseJsonFormatterInput({ text: 1, indent: 2, mode: "format" })).toMatchObject({
			ok: false,
			error: { code: "invalid_input" },
		});
	});
});

describe("validateJson", () => {
	test("rejects empty input with a specific code", () => {
		expect(validateJson("   ")).toMatchObject({ ok: false, error: { code: "empty_input" } });
	});

	test("parses a valid object", () => {
		expect(validateJson('{"a":1}')).toEqual({ ok: true, value: { a: 1 } });
	});

	test("reports the line and column of a trailing comma", () => {
		const result = validateJson('{\n  "a": 1,\n}');
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("invalid_json");
			expect(result.error.line).toBe(3);
			expect(result.error.column).toBe(1);
		}
	});

	test("reports the line and column of an unquoted key", () => {
		const result = validateJson("{a: 1}");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.line).toBe(1);
			expect(result.error.column).toBe(2);
		}
	});

	test("rejects trailing content after a valid value", () => {
		expect(validateJson("{} {}")).toMatchObject({ ok: false, error: { code: "invalid_json" } });
	});
});

describe("runJsonFormatter", () => {
	test("formats with a 2-space indent", () => {
		expect(runJsonFormatter({ text: '{"a":1}', indent: 2, mode: "format" })).toEqual({
			ok: true,
			value: { result: '{\n  "a": 1\n}', mode: "format" },
		});
	});

	test("formats with a tab indent", () => {
		expect(runJsonFormatter({ text: '{"a":1}', indent: "tab", mode: "format" })).toEqual({
			ok: true,
			value: { result: '{\n\t"a": 1\n}', mode: "format" },
		});
	});

	test("minifies away whitespace", () => {
		expect(runJsonFormatter({ text: '{ "a" : 1 }', indent: 2, mode: "minify" })).toEqual({
			ok: true,
			value: { result: '{"a":1}', mode: "minify" },
		});
	});

	test("round-trips arrays, nesting, and unicode strings", () => {
		const text = '{"list":[1,2,3],"nested":{"ok":true},"text":"héllo"}';
		const formatted = runJsonFormatter({ text, indent: 2, mode: "format" });
		expect(formatted.ok).toBe(true);
		if (formatted.ok) {
			expect(JSON.parse(formatted.value.result)).toEqual(JSON.parse(text));
		}
	});

	test("passes through invalid_json errors without formatting", () => {
		expect(runJsonFormatter({ text: "{", indent: 2, mode: "format" })).toMatchObject({
			ok: false,
			error: { code: "invalid_json" },
		});
	});

	test("sorts object keys when sortKeys is true", () => {
		expect(
			runJsonFormatter({ text: '{"b":1,"a":2}', indent: 2, mode: "format", sortKeys: true }),
		).toEqual({
			ok: true,
			value: { result: '{\n  "a": 2,\n  "b": 1\n}', mode: "format" },
		});
	});

	test("sorts nested keys without touching array order", () => {
		const result = runJsonFormatter({
			text: '{"z":{"d":1,"c":2},"list":[3,2,1]}',
			indent: 2,
			mode: "format",
			sortKeys: true,
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(JSON.parse(result.value.result)).toEqual({ z: { c: 2, d: 1 }, list: [3, 2, 1] });
			expect(result.value.result.indexOf('"list"')).toBeLessThan(
				result.value.result.indexOf('"z"'),
			);
		}
	});

	test("keeps key order when sortKeys is absent", () => {
		expect(runJsonFormatter({ text: '{"b":1,"a":2}', indent: 2, mode: "format" })).toEqual({
			ok: true,
			value: { result: '{\n  "b": 1,\n  "a": 2\n}', mode: "format" },
		});
	});
});

describe("sortJsonKeys", () => {
	test("sorts keys recursively", () => {
		expect(sortJsonKeys({ b: 1, a: { d: 1, c: 2 } })).toEqual({ a: { c: 2, d: 1 }, b: 1 });
	});

	test("maps arrays without reordering them", () => {
		expect(sortJsonKeys([{ b: 1, a: 2 }])).toEqual([{ a: 2, b: 1 }]);
	});

	test("does not let a __proto__ key hijack the prototype", () => {
		const sorted = sortJsonKeys(JSON.parse('{"b":1,"__proto__":2,"a":3}')) as Record<
			string,
			unknown
		>;
		expect(Object.getPrototypeOf(sorted)).toBe(Object.prototype);
		expect(Object.keys(sorted)).toEqual(["__proto__", "a", "b"]);
		expect(JSON.stringify(sorted)).toBe('{"__proto__":2,"a":3,"b":1}');
	});
});

describe("getJsonStats", () => {
	test("reports lines, bytes, keys, and depth", () => {
		expect(getJsonStats('{\n  "a": 1,\n  "b": {"c": 2}\n}')).toEqual({
			ok: true,
			value: { lines: 4, bytes: 29, keys: 3, depth: 2 },
		});
	});

	test("counts a flat object as depth 1", () => {
		expect(getJsonStats('{"a":1}')).toMatchObject({ ok: true, value: { keys: 1, depth: 1 } });
	});

	test("passes through invalid_json errors", () => {
		expect(getJsonStats("{")).toMatchObject({ ok: false, error: { code: "invalid_json" } });
	});
});
