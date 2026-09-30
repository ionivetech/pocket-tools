import { describe, expect, test } from "bun:test";
import {
	clearHistory,
	deleteHistoryEntry,
	listHistory,
	recordHistory,
	TOOL_HISTORY_CAP,
} from "../../app/utils/tool-history";

if (typeof localStorage === "undefined") {
	const store = new Map<string, string>();
	(globalThis as Record<string, unknown>).localStorage = {
		getItem: (key: string) => store.get(key) ?? null,
		setItem: (key: string, value: string) => {
			store.set(key, value);
		},
		removeItem: (key: string) => {
			store.delete(key);
		},
		clear: () => store.clear(),
	};
}

describe("tool-history", () => {
	test("records newest-first and caps per tool", () => {
		localStorage.clear();
		for (let i = 0; i < TOOL_HISTORY_CAP + 5; i += 1) {
			recordHistory("json-formatter", { input: `in-${i}`, output: `out-${i}` });
		}
		const entries = listHistory("json-formatter");
		expect(entries).toHaveLength(TOOL_HISTORY_CAP);
		expect(entries[0]?.input).toBe(`in-${TOOL_HISTORY_CAP + 4}`);
	});

	test("delete and clear remove entries", () => {
		localStorage.clear();
		const first = recordHistory("text-cleaner", { input: "a", output: "b" });
		recordHistory("text-cleaner", { input: "c", output: "d" });
		deleteHistoryEntry("text-cleaner", first.id);
		expect(listHistory("text-cleaner")).toHaveLength(1);
		clearHistory("text-cleaner");
		expect(listHistory("text-cleaner")).toEqual([]);
	});

	test("corrupt storage reads as empty", () => {
		localStorage.clear();
		localStorage.setItem("pockettools-history-v1", "not-json{{{");
		expect(listHistory("json-formatter")).toEqual([]);
	});
});
