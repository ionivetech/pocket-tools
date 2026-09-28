import { describe, expect, test } from "bun:test";
import { countText, detectEnding, readingTimeLabel, runTextCleaner } from "./logic";
import { isTextCaseTransform, isTextLineEnding, parseTextCleanerInput } from "./schema";

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

	test("rejects a non-object value", () => {
		expect(parseTextCleanerInput("hi")).toMatchObject({
			ok: false,
			error: { code: "invalid_input" },
		});
	});

	test("rejects a non-boolean collapse flag", () => {
		expect(
			parseTextCleanerInput({
				text: "hi",
				trim: true,
				collapseWhitespace: 1,
				caseTransform: "none",
			}),
		).toMatchObject({ ok: false, error: { code: "invalid_input" } });
	});

	test("rejects an unsupported case transform", () => {
		expect(
			parseTextCleanerInput({
				text: "hi",
				trim: true,
				collapseWhitespace: true,
				caseTransform: "mixed",
			}),
		).toMatchObject({ ok: false, error: { code: "invalid_input" } });
	});

	test("rejects a non-boolean removeEmptyLines flag", () => {
		expect(
			parseTextCleanerInput({
				text: "hi",
				trim: true,
				collapseWhitespace: true,
				caseTransform: "none",
				removeEmptyLines: 1,
			}),
		).toMatchObject({ ok: false, error: { code: "invalid_input" } });
	});

	test("rejects a non-boolean removeDuplicateLines flag", () => {
		expect(
			parseTextCleanerInput({
				text: "hi",
				trim: true,
				collapseWhitespace: true,
				caseTransform: "none",
				removeDuplicateLines: 1,
			}),
		).toMatchObject({ ok: false, error: { code: "invalid_input" } });
	});

	test("rejects an unsupported line ending", () => {
		expect(
			parseTextCleanerInput({
				text: "hi",
				trim: true,
				collapseWhitespace: true,
				caseTransform: "none",
				lineEnding: "cr",
			}),
		).toMatchObject({ ok: false, error: { code: "invalid_input" } });
	});

	test("accepts a record with every option set", () => {
		expect(
			parseTextCleanerInput({
				text: "hi",
				trim: true,
				collapseWhitespace: true,
				caseTransform: "upper",
				removeEmptyLines: true,
				removeDuplicateLines: true,
				lineEnding: "lf",
				stripHtml: true,
			}),
		).toMatchObject({ ok: true });
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

	test("removes empty lines while keeping the rest", () => {
		const result = runTextCleaner({
			text: "one\n\n   \ntwo\n",
			trim: true,
			collapseWhitespace: false,
			caseTransform: "none",
			removeEmptyLines: true,
		});
		expect(result).toMatchObject({ ok: true, value: { result: "one\ntwo" } });
	});

	test("removes duplicate lines keeping the first occurrence", () => {
		const result = runTextCleaner({
			text: "b\na\nb\nc\na",
			trim: false,
			collapseWhitespace: false,
			caseTransform: "none",
			removeDuplicateLines: true,
		});
		expect(result).toMatchObject({ ok: true, value: { result: "b\na\nc" } });
	});

	test("converts line endings to CRLF", () => {
		const result = runTextCleaner({
			text: "one\ntwo",
			trim: false,
			collapseWhitespace: false,
			caseTransform: "none",
			lineEnding: "crlf",
		});
		expect(result).toMatchObject({ ok: true, value: { result: "one\r\ntwo" } });
	});

	test("keeps CRLF input as CRLF by default", () => {
		const result = runTextCleaner({
			text: "one\r\ntwo",
			trim: false,
			collapseWhitespace: false,
			caseTransform: "none",
		});
		expect(result).toMatchObject({ ok: true, value: { result: "one\r\ntwo" } });
	});

	test("strips HTML tags before collapsing spaces", () => {
		const result = runTextCleaner({
			text: "<p>Hello  <b>World</b></p>",
			trim: true,
			collapseWhitespace: true,
			caseTransform: "none",
			stripHtml: true,
		});
		expect(result).toMatchObject({ ok: true, value: { result: "Hello World" } });
	});

	test("rejects a non-boolean stripHtml flag", () => {
		expect(
			parseTextCleanerInput({
				text: "hi",
				trim: true,
				collapseWhitespace: true,
				caseTransform: "none",
				stripHtml: "yes",
			}),
		).toMatchObject({ ok: false, error: { code: "invalid_input" } });
	});

	test("accepts every line ending value", () => {
		expect(isTextLineEnding("keep")).toBe(true);
		expect(isTextLineEnding("lf")).toBe(true);
		expect(isTextLineEnding("crlf")).toBe(true);
		expect(isTextLineEnding("cr")).toBe(false);
	});
});

describe("detectEnding", () => {
	test("prefers CRLF when present, LF otherwise", () => {
		expect(detectEnding("a\r\nb")).toBe("\r\n");
		expect(detectEnding("a\nb")).toBe("\n");
		expect(detectEnding("single")).toBe("\n");
	});
});

describe("readingTimeLabel", () => {
	test("labels empty, short, and long text", () => {
		expect(readingTimeLabel(0)).toBe("nothing to read yet");
		expect(readingTimeLabel(30)).toBe("under a min read");
		expect(readingTimeLabel(400)).toBe("2 min read");
	});
});
