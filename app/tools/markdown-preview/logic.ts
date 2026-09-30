import type { Result } from "../../types/tool";
import { renderMarkdownSubset, SUPPORTED_MARKDOWN_SYNTAX } from "../../utils/markdown-subset";
import { parseMarkdownPreviewInput, type MarkdownPreviewInput } from "./schema";

export type MarkdownPreviewOutput = Readonly<{
	html: string;
	supported: readonly string[];
}>;

/**
 * Renders the safe markdown subset to HTML. The renderer escapes raw HTML and
 * allows http(s) links only, so the component can inject the result without a
 * sanitizer dependency.
 *
 * @example
 * ```ts
 * runMarkdownPreview({ text: "# Hi" }).value.html; // "<h1>Hi</h1>"
 * runMarkdownPreview({ text: "" }).error.code; // "empty_input"
 * ```
 */
export function runMarkdownPreview(input: MarkdownPreviewInput): Result<MarkdownPreviewOutput> {
	const validated = parseMarkdownPreviewInput(input);
	if (!validated.ok) {
		return validated;
	}
	if (validated.value.text.trim() === "") {
		return {
			ok: false,
			error: { code: "empty_input", message: "Write some markdown first." },
		};
	}
	return {
		ok: true,
		value: {
			html: renderMarkdownSubset(validated.value.text),
			supported: SUPPORTED_MARKDOWN_SYNTAX,
		},
	};
}
