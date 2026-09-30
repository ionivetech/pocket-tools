import { describe, expect, test } from "bun:test";
import { runTableToMarkdown } from "./logic";
import { parseTableToMarkdownInput } from "./schema";

describe("table-to-markdown", () => {
	test("rejects a non-string text value", () => {
		expect(parseTableToMarkdownInput({ text: 1 })).toMatchObject({
			ok: false,
			error: { code: "invalid_input" },
		});
	});

	test("converts CSV with a header row", () => {
		const result = runTableToMarkdown({ text: "a,b\n1,2", header: true });
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.table).toBe("| a | b |\n| --- | --- |\n| 1 | 2 |");
		expect(result.value.delimiter).toBe(",");
	});

	test("detects tabs and pads ragged rows", () => {
		const result = runTableToMarkdown({ text: "a\tb\tc\n1\t2", header: true });
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.delimiter).toBe("tab");
		expect(result.value.columns).toBe(3);
		expect(result.value.table).toContain("| 1 | 2 |  |");
	});

	test("understands quoted fields and escapes pipes", () => {
		const result = runTableToMarkdown({ text: '"a,b"|c\n1|2', header: false });
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.table).toContain("a,b");
	});

	test("rejects blank input with a code", () => {
		expect(runTableToMarkdown({ text: "   ", header: true })).toMatchObject({
			ok: false,
			error: { code: "empty_input" },
		});
	});
});
