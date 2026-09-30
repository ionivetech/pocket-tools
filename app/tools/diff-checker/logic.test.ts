import { describe, expect, test } from "bun:test";
import { runDiffChecker } from "./logic";
import { parseDiffCheckerInput } from "./schema";

describe("diff-checker", () => {
	test("rejects non-string sides", () => {
		expect(parseDiffCheckerInput({ original: 1 })).toMatchObject({
			ok: false,
			error: { code: "invalid_input" },
		});
	});

	test("marks changed lines as removed and added", () => {
		const result = runDiffChecker({
			original: "a\nb\nc",
			changed: "a\nB\nc",
			ignoreWhitespace: false,
		});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.added).toBe(1);
		expect(result.value.removed).toBe(1);
		expect(result.value.rows.map((row) => row.type)).toEqual(["same", "del", "add", "same"]);
	});

	test("reports identical texts with zero counts", () => {
		const result = runDiffChecker({
			original: "same\ntext",
			changed: "same\ntext",
			ignoreWhitespace: false,
		});
		expect(result).toMatchObject({ ok: true, value: { added: 0, removed: 0 } });
	});

	test("ignores whitespace-only edits on request", () => {
		const strict = runDiffChecker({
			original: "hello   world",
			changed: "hello world",
			ignoreWhitespace: false,
		});
		const loose = runDiffChecker({
			original: "hello   world",
			changed: "hello world",
			ignoreWhitespace: true,
		});
		expect(strict).toMatchObject({ ok: true, value: { added: 1, removed: 1 } });
		expect(loose).toMatchObject({ ok: true, value: { added: 0, removed: 0 } });
	});

	test("caps oversized sides with a code", () => {
		const big = `${"x\n".repeat(1001)}`;
		expect(runDiffChecker({ original: big, changed: "y", ignoreWhitespace: false })).toMatchObject({
			ok: false,
			error: { code: "input_too_large" },
		});
	});
});
