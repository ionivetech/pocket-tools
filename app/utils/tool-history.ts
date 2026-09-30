export type ToolHistoryEntry = Readonly<{
	id: string;
	input: string;
	output: string;
	at: number;
}>;

const STORAGE_KEY = "pockettools-history-v1";
export const TOOL_HISTORY_CAP = 20;
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

type HistoryMap = Record<string, ToolHistoryEntry[]>;

function isEntry(value: unknown): value is ToolHistoryEntry {
	if (typeof value !== "object" || value === null) return false;
	const record = value as Record<string, unknown>;
	return (
		typeof record.id === "string" &&
		typeof record.input === "string" &&
		typeof record.output === "string" &&
		typeof record.at === "number"
	);
}

function readAll(): HistoryMap {
	if (typeof localStorage === "undefined") return {};
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return {};
		const parsed: unknown = JSON.parse(raw);
		if (typeof parsed !== "object" || parsed === null) return {};
		const map: HistoryMap = {};
		for (const [slug, entries] of Object.entries(parsed as Record<string, unknown>)) {
			if (!Array.isArray(entries)) continue;
			const fresh = entries
				.filter(isEntry)
				.filter((entry) => Date.now() - entry.at <= RETENTION_MS);
			if (fresh.length > 0) map[slug] = fresh.slice(0, TOOL_HISTORY_CAP);
		}
		return map;
	} catch {
		return {};
	}
}

function writeAll(map: HistoryMap): void {
	if (typeof localStorage === "undefined") return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
	} catch {
		// Storage full or blocked — history is best-effort, never breaks the tool.
	}
}

/**
 * Lists history entries for a tool, newest first. Entries older than 30 days
 * are pruned on read. Kept only in this browser, never uploaded.
 *
 * @example
 * ```ts
 * listHistory("json-formatter"); // []
 * ```
 */
export function listHistory(toolSlug: string): ToolHistoryEntry[] {
	return readAll()[toolSlug] ?? [];
}

/**
 * Records one tool run, newest first, capped at 20 per tool.
 *
 * @example
 * ```ts
 * recordHistory("json-formatter", { input: "{}", output: "{}" });
 * ```
 */
export function recordHistory(
	toolSlug: string,
	entry: Pick<ToolHistoryEntry, "input" | "output">,
): ToolHistoryEntry {
	const item: ToolHistoryEntry = {
		id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
		input: entry.input.slice(0, 4000),
		output: entry.output.slice(0, 4000),
		at: Date.now(),
	};
	const map = readAll();
	const next = [item, ...(map[toolSlug] ?? [])].slice(0, TOOL_HISTORY_CAP);
	map[toolSlug] = next;
	writeAll(map);
	if (typeof window !== "undefined") {
		window.dispatchEvent(new CustomEvent("pockettools:history-recorded", { detail: toolSlug }));
	}
	return item;
}

/**
 * Deletes one entry. No-op when missing.
 *
 * @example
 * ```ts
 * deleteHistoryEntry("json-formatter", id);
 * ```
 */
export function deleteHistoryEntry(toolSlug: string, id: string): void {
	const map = readAll();
	const entries = map[toolSlug];
	if (!entries) return;
	map[toolSlug] = entries.filter((entry) => entry.id !== id);
	if (map[toolSlug].length === 0) delete map[toolSlug];
	writeAll(map);
}

/**
 * Clears all history for one tool.
 *
 * @example
 * ```ts
 * clearHistory("json-formatter");
 * ```
 */
export function clearHistory(toolSlug: string): void {
	const map = readAll();
	delete map[toolSlug];
	writeAll(map);
}
