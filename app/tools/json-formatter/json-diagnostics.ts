import { parseJsonWithLocation } from "./json-parser";

export type JsonDiagnostic = Readonly<{
	line: number;
	column: number;
	message: string;
}>;

/**
 * Maps the tool's own parser error to editor diagnostics, so CodeMirror shows
 * the exact same message as the status bar. Empty text or valid JSON yields
 * no diagnostics.
 *
 * @example
 * ```ts
 * jsonDiagnostics('{\n  "a": 1,\n}'); // [{ line: 3, column: 1, message: "…" }]
 * jsonDiagnostics('{"a":1}'); // []
 * ```
 */
export function jsonDiagnostics(text: string): readonly JsonDiagnostic[] {
	if (text.trim() === "") {
		return [];
	}
	const parsed = parseJsonWithLocation(text);
	if (parsed.ok) {
		return [];
	}
	return [
		{
			line: parsed.error.line ?? 1,
			column: parsed.error.column ?? 1,
			message: parsed.error.message,
		},
	];
}

/**
 * Converts a 1-based line/column (the parser's convention) to a 0-based string
 * offset, clamping onto the line so hostile or wide-character positions can
 * never escape the document.
 *
 * @example
 * ```ts
 * lineColToOffset("ab\ncde", 2, 2); // 4
 * ```
 */
export function lineColToOffset(text: string, line: number, column: number): number {
	const lines = text.split("\n");
	const clampedLine = Math.min(Math.max(1, Math.floor(line)), lines.length);
	const lineStart = lines
		.slice(0, clampedLine - 1)
		.reduce((total, current) => total + current.length + 1, 0);
	const lineText = lines[clampedLine - 1] ?? "";
	const clampedColumn = Math.min(Math.max(1, Math.floor(column)), lineText.length + 1);
	return lineStart + clampedColumn - 1;
}
