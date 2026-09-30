import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

describe("tool library", () => {
	test("recent cap is documented and small", async () => {
		const source = await readFile(
			resolve(import.meta.dir, "../../app/composables/use-tool-library.ts"),
			"utf8",
		);
		expect(source).toContain("TOOL_LIBRARY_RECENT_CAP = 5");
	});

	test("composable exposes favorites, recents, and clear controls", async () => {
		const source = await readFile(
			resolve(import.meta.dir, "../../app/composables/use-tool-library.ts"),
			"utf8",
		);
		for (const symbol of [
			"toggleFavorite",
			"markRecent",
			"clearFavorites",
			"clearRecent",
			"isFavorite",
			"favoriteTools",
			"recentTools",
		]) {
			expect(source).toContain(symbol);
		}
	});
});
