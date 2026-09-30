import { describe, expect, test } from "bun:test";
import { runRegexTester } from "./logic";
import { parseRegexTesterInput } from "./schema";

describe("regex-tester", () => {
	test("rejects unknown flag letters", () => {
		expect(parseRegexTesterInput({ pattern: "a", flags: "z", sample: "" })).toMatchObject({
			ok: false,
			error: { code: "invalid_input" },
		});
	});

	test("finds every digit run with capture groups", () => {
		const result = runRegexTester({ pattern: "(\\d+)-(\\d+)", flags: "", sample: "a12-34b" });
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.matches).toHaveLength(1);
		expect(result.value.matches[0]).toMatchObject({
			index: 1,
			text: "12-34",
			groups: ["12", "34"],
		});
	});

	test("scans globally even without the g flag", () => {
		const result = runRegexTester({ pattern: "\\d+", flags: "", sample: "a1b22" });
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.matches.map((match) => match.text)).toEqual(["1", "22"]);
	});

	test("honors the i flag", () => {
		const result = runRegexTester({ pattern: "hi", flags: "i", sample: "HI there" });
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.matches).toHaveLength(1);
	});

	test("names bad patterns and oversized input with codes", () => {
		expect(runRegexTester({ pattern: "(", flags: "", sample: "" })).toMatchObject({
			ok: false,
			error: { code: "invalid_pattern" },
		});
		expect(runRegexTester({ pattern: "", flags: "", sample: "" })).toMatchObject({
			ok: false,
			error: { code: "empty_input" },
		});
		expect(runRegexTester({ pattern: "a".repeat(501), flags: "", sample: "" })).toMatchObject({
			ok: false,
			error: { code: "input_too_large" },
		});
	});

	test("caps runaway matches and says so", () => {
		const result = runRegexTester({ pattern: "a", flags: "", sample: "a".repeat(500) });
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.matches).toHaveLength(100);
		expect(result.value.truncated).toBe(true);
	});
});
