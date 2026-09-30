import type { Result } from "../../types/tool";
import { parseTableToMarkdownInput, type TableToMarkdownInput } from "./schema";

export type TableToMarkdownOutput = Readonly<{
	table: string;
	rows: number;
	columns: number;
	delimiter: string;
}>;

function detectDelimiter(text: string): string {
	const firstLines = text.split("\n").slice(0, 5).join("\n");
	const tabs = firstLines.split("\t").length - 1;
	const semis = firstLines.split(";").length - 1;
	const commas = firstLines.split(",").length - 1;
	if (tabs > 0 && tabs >= semis && tabs >= commas) {
		return "\t";
	}
	if (semis > commas) {
		return ";";
	}
	return ",";
}

function splitRow(line: string, delimiter: string): string[] {
	const cells: string[] = [];
	let current = "";
	let quoted = false;
	for (let index = 0; index < line.length; index += 1) {
		const char = line[index]!;
		if (quoted) {
			if (char === '"') {
				if (line[index + 1] === '"') {
					current += '"';
					index += 1;
				} else {
					quoted = false;
				}
			} else {
				current += char;
			}
		} else if (char === '"') {
			quoted = true;
		} else if (char === delimiter) {
			cells.push(current);
			current = "";
		} else {
			current += char;
		}
	}
	cells.push(current);
	return cells.map((cell) => cell.trim());
}

function escapeCell(cell: string): string {
	return cell.replaceAll("|", "\\|").replaceAll("\n", "<br />");
}

/**
 * Converts pasted spreadsheet cells (CSV/TSV/semicolon) into a markdown
 * table. The delimiter is detected from the first lines; quoted fields with
 * doubled quotes are understood.
 *
 * @example
 * ```ts
 * runTableToMarkdown({ text: "a,b\n1,2", header: true }).value.table;
 * // "| a | b |\n| --- | --- |\n| 1 | 2 |"
 * ```
 */
export function runTableToMarkdown(input: TableToMarkdownInput): Result<TableToMarkdownOutput> {
	const validated = parseTableToMarkdownInput(input);
	if (!validated.ok) {
		return validated;
	}
	const { text, header } = validated.value;
	if (text.trim() === "") {
		return {
			ok: false,
			error: { code: "empty_input", message: "Paste some spreadsheet cells first." },
		};
	}
	const delimiter = detectDelimiter(text);
	const rows = text
		.split("\n")
		.map((line) => line.replace(/\r$/, ""))
		.filter((line) => line.trim() !== "")
		.map((line) => splitRow(line, delimiter));
	if (rows.length === 0) {
		return {
			ok: false,
			error: { code: "empty_input", message: "Paste some spreadsheet cells first." },
		};
	}
	const columns = Math.max(...rows.map((row) => row.length));
	const padded = rows.map((row) => {
		const cells = [...row];
		while (cells.length < columns) {
			cells.push("");
		}
		return cells;
	});

	const lines: string[] = [];
	const start = header ? 1 : 0;
	if (header) {
		lines.push(`| ${(padded[0] ?? []).map(escapeCell).join(" | ")} |`);
	}
	lines.push(`| ${Array.from({ length: columns }, () => "---").join(" | ")} |`);
	for (const row of padded.slice(start)) {
		lines.push(`| ${row.map(escapeCell).join(" | ")} |`);
	}

	return {
		ok: true,
		value: {
			table: lines.join("\n"),
			rows: padded.length,
			columns,
			delimiter: delimiter === "\t" ? "tab" : delimiter,
		},
	};
}
