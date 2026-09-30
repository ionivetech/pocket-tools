import { describe, expect, test } from "bun:test";
import { shortcuts } from "../../app/data/shortcuts";

describe("shortcuts registry", () => {
	test("covers palette, search, help, navigation, close", () => {
		expect(shortcuts.map((s) => s.id)).toEqual([
			"palette",
			"search",
			"help",
			"home",
			"library",
			"close",
		]);
	});

	test("every shortcut has keys, label, hint", () => {
		for (const shortcut of shortcuts) {
			expect(shortcut.keys.length).toBeGreaterThan(0);
			expect(shortcut.label.length).toBeGreaterThan(0);
			expect(shortcut.hint.length).toBeGreaterThan(0);
		}
	});
});
