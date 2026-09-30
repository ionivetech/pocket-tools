import type { Result } from "../../types/tool";

export type TableToMarkdownInput = Readonly<{
	text: string;
	header: boolean;
}>;

/**
 * Manual parser for this tool's input shape.
 *
 * @example
 * ```ts
 * parseTableToMarkdownInput({ text: "a,b", header: true }).ok; // true
 * parseTableToMarkdownInput({ text: 1 }).error.code; // "invalid_input"
 * ```
 */
export function parseTableToMarkdownInput(value: unknown): Result<TableToMarkdownInput> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Input must be an object." },
		};
	}
	const record = value as { readonly text?: unknown; readonly header?: unknown };
	if (typeof record.text !== "string") {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Text must be a string." },
		};
	}
	return {
		ok: true,
		value: { text: record.text, header: record.header !== false },
	};
}
