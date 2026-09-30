import type { ToolDefinition } from "../types/tool";

/**
 * Scores how well `query` fuzzy-matches `haystack`.
 * Returns -1 when the query characters do not appear in order.
 * Higher is better; exact-prefix and word-boundary hits rank first.
 *
 * @example
 * ```ts
 * fuzzyScore("JSON formatter", "jsn"); // > 0
 * fuzzyScore("JSON formatter", "zzz"); // -1
 * ```
 */
export function fuzzyScore(haystack: string, query: string): number {
	const text = haystack.toLowerCase();
	const pattern = query.trim().toLowerCase();
	if (pattern.length === 0) return 0;
	if (pattern.length > text.length) return -1;

	let score = 0;
	let textIndex = 0;
	let consecutive = 0;
	let firstAt = -1;

	for (let p = 0; p < pattern.length; p += 1) {
		const char = pattern.charAt(p);
		const found = text.indexOf(char, textIndex);
		if (found === -1) return -1;
		if (firstAt === -1) firstAt = found;

		// Bonus: match at start or after a word boundary.
		if (found === 0 || /[\s\-_/]/.test(text[found - 1] ?? "")) {
			score += 8;
		} else if (found === textIndex) {
			// Bonus: consecutive run.
			consecutive += 1;
			score += 4 + consecutive;
		} else {
			consecutive = 0;
			score += 1;
		}

		// Penalty: distance skipped.
		score -= Math.min(found - textIndex, 6);
		textIndex = found + 1;
	}

	// Prefer matches that start early and cover a short span.
	score -= firstAt;
	score += Math.max(0, 12 - (textIndex - firstAt - pattern.length));
	return score;
}

function toolHaystack(tool: ToolDefinition): string {
	return `${tool.name} ${tool.description} ${tool.category} ${tool.keywords.join(" ")} ${tool.slug.replace(/-/g, " ")}`;
}

/**
 * Fuzzy-filters tools by query, best match first.
 * Empty query returns the input order (callers rank recents/favorites on top).
 *
 * @example
 * ```ts
 * fuzzyFilterTools(tools, "jsn"); // [jsonFormatter, ...]
 * ```
 */
export function fuzzyFilterTools(
	definitions: readonly ToolDefinition[],
	query: string,
): ToolDefinition[] {
	const pattern = query.trim();
	if (pattern.length === 0) return [...definitions];

	const scored: Array<{ tool: ToolDefinition; score: number }> = [];
	for (const tool of definitions) {
		const score = fuzzyScore(toolHaystack(tool), pattern);
		if (score >= 0) scored.push({ tool, score });
	}
	scored.sort((a, b) => b.score - a.score);
	return scored.map((entry) => entry.tool);
}
