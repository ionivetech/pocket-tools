import { describe, expect, test } from "bun:test";
import { renderMarkdownSubset, SUPPORTED_MARKDOWN_SYNTAX } from "../../app/utils/markdown-subset";

describe("markdown-subset", () => {
	test("renders headings, bold, italic and inline code", () => {
		const html = renderMarkdownSubset("# Title\n\nHello **bold** and *italic* with `code`.");
		expect(html).toContain("<h1>Title</h1>");
		expect(html).toContain("<strong>bold</strong>");
		expect(html).toContain("<em>italic</em>");
		expect(html).toContain("<code>code</code>");
	});

	test("renders fenced code blocks without formatting their content", () => {
		const html = renderMarkdownSubset("```\n**not bold** <b>not html</b>\n```");
		expect(html).toContain("<pre><code>");
		expect(html).not.toContain("<strong>");
		expect(html).toContain("&lt;b&gt;");
	});

	test("renders lists, quotes, links and rules", () => {
		const html = renderMarkdownSubset(
			"- one\n- two\n\n1. first\n2. second\n\n> quoted\n\n[docs](https://example.com)\n\n---",
		);
		expect(html).toContain("<ul>");
		expect(html).toContain("<ol>");
		expect(html).toContain("<blockquote>");
		expect(html).toContain('<a href="https://example.com" rel="noopener">docs</a>');
		expect(html).toContain("<hr />");
	});

	test("escapes raw HTML instead of rendering it", () => {
		const html = renderMarkdownSubset("<script>alert(1)</script>");
		expect(html).not.toContain("<script>");
		expect(html).toContain("&lt;script&gt;");
	});

	test("neuters javascript: links", () => {
		const html = renderMarkdownSubset("[click](javascript:alert(1))");
		expect(html).not.toContain("javascript:");
		expect(html).toContain("click");
	});

	test("documents exactly what the subset supports", () => {
		expect(SUPPORTED_MARKDOWN_SYNTAX.length).toBeGreaterThan(5);
		expect(SUPPORTED_MARKDOWN_SYNTAX.join(" ")).toContain("headings");
	});
});

describe("markdown-subset termination (regression)", () => {
	// Each of these starts with a paragraph terminator yet matches no block
	// branch. They froze the tab in an infinite loop once already.
	test.each([
		["emphasis marker", "***bold***"],
		["emphasis with a stray star", "***bold**"],
		["empty heading", "# "],
		["empty tab heading", "#\t"],
		["deep empty heading", "###### "],
		["rule prefix with text", "--- a"],
		["repeated rule chars", "----"],
		["repeated stars", "****"],
		["repeated underscores", "_____"],
		["mixed", "***a**"],
	])("terminates on %s", (_label, input) => {
		expect(renderMarkdownSubset(input)).toBeTypeOf("string");
	});

	test("keeps a multi-line document intact around the hostile lines", () => {
		const html = renderMarkdownSubset("# Title\n\n***bold***\n\ntail text\n\n----\n\nend");
		expect(html).toContain("<h1>Title</h1>");
		expect(html).toContain("tail text");
		expect(html).toContain("end");
	});

	test("a NUL in the input cannot forge a placeholder", () => {
		const html = renderMarkdownSubset("a \u0000code-9\u0000 b");
		expect(html).not.toContain("\u0000");
		expect(html).not.toContain("<code>");
	});
});
