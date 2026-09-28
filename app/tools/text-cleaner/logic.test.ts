import { describe, expect, test } from "bun:test";
import { countText, runTextCleaner } from "./logic";
import { isTextCaseTransform, parseTextCleanerInput } from "./schema";

describe("text-cleaner schema", () => {
	test("accepts a valid record", () => {
		expect(
			parseTextCleanerInput({
				text: "hi",
				trim: true,
				collapseWhitespace: true,
				caseTransform: "none",
			}),
		).toMatchObject({ ok: true });
	});

	test.each(["none", "upper", "lower", "title", "sentence"])(
		"accepts case transform %p",
		(caseTransform) => {
			expect(isTextCaseTransform(caseTransform)).toBe(true);
		},
	);

	test("rejects an unsupported case transform", () => {
		expect(isTextCaseTransform("mixed")).toBe(false);
	});

	test("rejects a non-boolean trim flag", () => {
		expect(
			parseTextCleanerInput({
				text: "hi",
				trim: "yes",
				collapseWhitespace: true,
				caseTransform: "none",
			}),
		).toMatchObject({ ok: false, error: { code: "invalid_input" } });
	});
});

describe("countText", () => {
	test("counts an empty string as zero lines", () => {
		expect(countText("")).toEqual({ words: 0, characters: 0, charactersNoSpaces: 0, lines: 0 });
	});

	test("counts words, characters, and lines", () => {
		expect(countText("hello world\nsecond line")).toEqual({
			words: 4,
			characters: 23,
			charactersNoSpaces: 20,
			lines: 2,
		});
	});

	test("counts multi-byte characters correctly", () => {
		expect(countText("héllo")).toMatchObject({ characters: 5 });
	});
});

describe("runTextCleaner", () => {
	test("trims and collapses whitespace", () => {
		const result = runTextCleaner({
			text: "  Hello   World  ",
			trim: true,
			collapseWhitespace: true,
			caseTransform: "none",
		});
		expect(result).toMatchObject({ ok: true, value: { result: "Hello World" } });
	});

	test("keeps paragraph breaks while collapsing horizontal whitespace", () => {
		const result = runTextCleaner({
			text: "line one\n\n\n\nline two",
			trim: false,
			collapseWhitespace: true,
			caseTransform: "none",
		});
		expect(result).toMatchObject({ ok: true, value: { result: "line one\n\nline two" } });
	});

	test.each([
		["upper", "HELLO WORLD"],
		["lower", "hello world"],
		["title", "Hello World"],
		["sentence", "Hello world"],
	] as const)("applies the %s case transform", (caseTransform, expected) => {
		const result = runTextCleaner({
			text: "hello world",
			trim: false,
			collapseWhitespace: false,
			caseTransform,
		});
		expect(result).toMatchObject({ ok: true, value: { result: expected } });
	});

	test("returns counts for the cleaned result, not the original", () => {
		const result = runTextCleaner({
			text: "  a b  ",
			trim: true,
			collapseWhitespace: true,
			caseTransform: "none",
		});
		expect(result).toMatchObject({ ok: true, value: { counts: { words: 2, characters: 3 } } });
	});

	test("leaves text untouched when every option is off", () => {
		const result = runTextCleaner({
			text: "  Keep  Me  ",
			trim: false,
			collapseWhitespace: false,
			caseTransform: "none",
		});
		expect(result).toMatchObject({ ok: true, value: { result: "  Keep  Me  " } });
	});
});
