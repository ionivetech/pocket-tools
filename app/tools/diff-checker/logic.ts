import type { Result } from "../../types/tool";
import { parseDiffCheckerInput, type DiffCheckerInput } from "./schema";

export const DIFF_LINE_CAP = 1000;

export type DiffRow = Readonly<{
	type: "same" | "del" | "add";
	text: string;
}>;

export type DiffCheckerOutput = Readonly<{
	rows: readonly DiffRow[];
	added: number;
	removed: number;
}>;

function normalize(line: string, ignoreWhitespace: boolean): string {
	const collapsed = line.replace(/\s+/g, " ");
	return ignoreWhitespace ? collapsed.trim() : line;
}

/**
 * Compares two texts line by line (LCS, 2-way). Differences render with −/+
 * markers and weight — no color is needed to read them.
 *
 * @example
 * ```ts
 * runDiffChecker({ original: "a\nb", changed: "a\nc", ignoreWhitespace: false }).value.added; // 1
 * ```
 */
export function runDiffChecker(input: DiffCheckerInput): Result<DiffCheckerOutput> {
	const validated = parseDiffCheckerInput(input);
	if (!validated.ok) {
		return validated;
	}
	const { original, changed, ignoreWhitespace } = validated.value;
	const oldLines = original.split("\n");
	const newLines = changed.split("\n");
	if (oldLines.length > DIFF_LINE_CAP || newLines.length > DIFF_LINE_CAP) {
		return {
			ok: false,
			error: {
				code: "input_too_large",
				message: `Keep each side under ${DIFF_LINE_CAP} lines for a readable diff.`,
			},
		};
	}

	const oldKeys = oldLines.map((line) => normalize(line, ignoreWhitespace));
	const newKeys = newLines.map((line) => normalize(line, ignoreWhitespace));

	const rows = oldLines.length + 1;
	const cols = newLines.length + 1;
	const table: number[][] = Array.from({ length: rows }, () =>
		Array.from({ length: cols }, () => 0),
	);
	for (let row = oldLines.length - 1; row >= 0; row -= 1) {
		for (let col = newLines.length - 1; col >= 0; col -= 1) {
			table[row]![col] =
				oldKeys[row] === newKeys[col]
					? (table[row + 1]![col + 1] ?? 0) + 1
					: Math.max(table[row + 1]![col] ?? 0, table[row]![col + 1] ?? 0);
		}
	}

	const diffRows: DiffRow[] = [];
	let added = 0;
	let removed = 0;
	let row = 0;
	let col = 0;
	while (row < oldLines.length && col < newLines.length) {
		if (oldKeys[row] === newKeys[col]) {
			diffRows.push({ type: "same", text: oldLines[row] ?? "" });
			row += 1;
			col += 1;
		} else if ((table[row + 1]?.[col] ?? 0) >= (table[row]?.[col + 1] ?? 0)) {
			diffRows.push({ type: "del", text: oldLines[row] ?? "" });
			removed += 1;
			row += 1;
		} else {
			diffRows.push({ type: "add", text: newLines[col] ?? "" });
			added += 1;
			col += 1;
		}
	}
	while (row < oldLines.length) {
		diffRows.push({ type: "del", text: oldLines[row] ?? "" });
		removed += 1;
		row += 1;
	}
	while (col < newLines.length) {
		diffRows.push({ type: "add", text: newLines[col] ?? "" });
		added += 1;
		col += 1;
	}

	return { ok: true, value: { rows: diffRows, added, removed } };
}
