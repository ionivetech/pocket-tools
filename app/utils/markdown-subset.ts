const FENCE_PLACEHOLDER = "\u0000fence-";
const CODE_PLACEHOLDER = "\u0000code-";

/**
 * The exact markdown constructs this renderer supports. Shown in the tool UI
 * so the preview never promises full CommonMark fidelity.
 *
 * @example
 * ```ts
 * SUPPORTED_MARKDOWN_SYNTAX.join(", "); // "headings, bold, ..."
 * ```
 */
export const SUPPORTED_MARKDOWN_SYNTAX: readonly string[] = [
	"headings",
	"bold",
	"italic",
	"inline code",
	"fenced code blocks",
	"links",
	"bulleted lists",
	"numbered lists",
	"quotes",
	"rules",
];

function escapeHtml(text: string): string {
	return text
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

function renderInline(text: string, codeSpans: readonly string[]): string {
	let out = text;
	out = out.replaceAll(/`([^`\n]+)`/g, (_, code: string) => {
		const index = codeSpans.length;
		(codeSpans as string[]).push(code);
		return `${CODE_PLACEHOLDER}${index}\u0000`;
	});
	out = out.replaceAll(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
	out = out.replaceAll(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>");
	out = out.replaceAll(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" rel="noopener">$1</a>');
	// Any other bracket-paren shape (javascript:, mailto:, broken) renders as
	// its text only, so no URI scheme can survive into the output.
	out = out.replaceAll(/\[([^\]]+)\]\([^)]*\)/g, "$1");
	return out.replaceAll(new RegExp(`${CODE_PLACEHOLDER}(\\d+)\u0000`, "g"), (_, index: string) => {
		const code = codeSpans[Number(index)] ?? "";
		return `<code>${code}</code>`;
	});
}

/**
 * Renders a safe markdown subset to HTML. Raw HTML is escaped, never passed
 * through, and links allow `http(s)` only — output is safe to inject without
 * a sanitizer dependency.
 *
 * @example
 * ```ts
 * renderMarkdownSubset("# Hi"); // "<h1>Hi</h1>"
 * renderMarkdownSubset("<script>x</script>"); // "&lt;script&gt;x&lt;/script&gt;"
 * ```
 */
export function renderMarkdownSubset(markdown: string): string {
	// Strip NUL at the input boundary: it is the sentinel the placeholder
	// channel uses, so a literal one in the text could forge a placeholder.
	// Doing it here rather than in `escapeHtml` matters, because that function
	// also runs over the internal placeholders this renderer inserts.
	const fences: string[] = [];
	const withoutFences = markdown
		.replaceAll("\u0000", "")
		.replaceAll("\r\n", "\n")
		.replaceAll(/^```[^\n]*\n([\s\S]*?)^```[ \t]*$/gm, (_, code: string) => {
			const index = fences.length;
			fences.push(escapeHtml(code.replace(/\n$/, "")));
			return `${FENCE_PLACEHOLDER}${index}\u0000`;
		});

	const codeSpans: string[] = [];
	const lines = escapeHtml(withoutFences).split("\n");
	const blocks: string[] = [];
	let index = 0;

	function flushList(kind: "ul" | "ol", items: string[]): void {
		if (items.length === 0) return;
		const tag = kind === "ul" ? "ul" : "ol";
		blocks.push(
			`<${tag}>${items.map((item) => `<li>${renderInline(item, codeSpans)}</li>`).join("")}</${tag}>`,
		);
	}

	while (index < lines.length) {
		const line = lines[index] ?? "";
		const fenceMatch = new RegExp(`^${FENCE_PLACEHOLDER}(\\d+)\u0000$`).exec(line);
		const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);

		if (fenceMatch) {
			blocks.push(`<pre><code>${fences[Number(fenceMatch[1])] ?? ""}</code></pre>`);
			index += 1;
		} else if (headingMatch) {
			const level = headingMatch[1]?.length ?? 1;
			blocks.push(`<h${level}>${renderInline(headingMatch[2] ?? "", codeSpans)}</h${level}>`);
			index += 1;
		} else if (/^(---|\*\*\*|___)[ \t]*$/.test(line)) {
			blocks.push("<hr />");
			index += 1;
		} else if (line.trim() === "") {
			index += 1;
		} else if (line.startsWith("&gt;")) {
			const quoted: string[] = [];
			while ((lines[index] ?? "").startsWith("&gt;")) {
				quoted.push((lines[index] ?? "").replace(/^&gt;[ \t]?/, ""));
				index += 1;
			}
			blocks.push(`<blockquote>${renderInline(quoted.join("<br />"), codeSpans)}</blockquote>`);
		} else if (/^[-*][ \t]+/.test(line)) {
			const items: string[] = [];
			while (/^[-*][ \t]+/.test(lines[index] ?? "")) {
				items.push((lines[index] ?? "").replace(/^[-*][ \t]+/, ""));
				index += 1;
			}
			flushList("ul", items);
		} else if (/^\d+[.)][ \t]+/.test(line)) {
			const items: string[] = [];
			while (/^\d+[.)][ \t]+/.test(lines[index] ?? "")) {
				items.push((lines[index] ?? "").replace(/^\d+[.)][ \t]+/, ""));
				index += 1;
			}
			flushList("ol", items);
		} else {
			const paragraph: string[] = [];
			while (
				index < lines.length &&
				(lines[index] ?? "").trim() !== "" &&
				!/^(#{1,6}\s|---|\*\*\*|___)/.test(lines[index] ?? "") &&
				!(lines[index] ?? "").startsWith("&gt;") &&
				!/^[-*][ \t]+/.test(lines[index] ?? "") &&
				!/^\d+[.)][ \t]+/.test(lines[index] ?? "") &&
				!new RegExp(`^${FENCE_PLACEHOLDER}\\d+\u0000$`).test(lines[index] ?? "")
			) {
				paragraph.push(lines[index] ?? "");
				index += 1;
			}
			if (paragraph.length === 0) {
				// This branch is the catch-all, so it is the one place that can
				// consume nothing: a line can satisfy the paragraph terminator above
				// (`***bold***`, `# `, `--- x`, `----`) while matching no block branch,
				// because the rule branch wants a bare `***`. Consuming the line here
				// is what guarantees the loop always advances. Without it the tab
				// spins forever, reachable from a share link before any interaction.
				paragraph.push(line);
				index += 1;
			}
			blocks.push(`<p>${renderInline(paragraph.join("<br />"), codeSpans)}</p>`);
		}
	}

	return blocks.join("\n");
}
