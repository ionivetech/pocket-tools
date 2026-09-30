import { describe, expect, test } from "bun:test";
import { runMarkdownPreview } from "./logic";
import { parseMarkdownPreviewInput } from "./schema";

describe("markdown-preview", () => {
	test("rejects a non-string text value", () => {
		expect(parseMarkdownPreviewInput({ text: 1 })).toMatchObject({
			ok: false,
			error: { code: "invalid_input" },
		});
	});

	test("renders a heading through the shared subset", () => {
		const result = runMarkdownPreview({ text: "# Hello" });
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.html).toBe("<h1>Hello</h1>");
		expect(result.value.supported).toContain("headings");
	});

	test("rejects blank input with a code", () => {
		expect(runMarkdownPreview({ text: "   " })).toMatchObject({
			ok: false,
			error: { code: "empty_input" },
		});
	});

	test("never passes raw HTML through", () => {
		const result = runMarkdownPreview({ text: "<img src=x onerror=alert(1)>" });
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.html).not.toContain("<img");
	});
});
