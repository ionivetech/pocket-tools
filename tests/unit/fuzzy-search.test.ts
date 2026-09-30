import { describe, expect, test } from "bun:test";
import { fuzzyFilterTools, fuzzyScore } from "../../app/utils/fuzzy-search";
import type { ToolDefinition } from "../../app/types/tool";

function stub(overrides: Partial<ToolDefinition> & { slug: string }): ToolDefinition {
	return {
		name: overrides.slug,
		description: "stub tool",
		category: "Developer",
		icon: "code",
		accent: "blue",
		keywords: [overrides.slug],
		componentPath: "~/components/ToolPlaceholder.vue",
		loadComponent: async () => ({}),
		...overrides,
	} as ToolDefinition;
}

const tools = [
	stub({
		slug: "json-formatter",
		name: "JSON formatter",
		description: "Tidy messy JSON",
		keywords: ["json", "format"],
	}),
	stub({
		slug: "text-cleaner",
		name: "Text cleaner",
		description: "Clean whitespace",
		category: "Text",
		keywords: ["text", "clean"],
	}),
	stub({
		slug: "uuid-generator",
		name: "UUID generator",
		description: "Make identifiers",
		keywords: ["uuid", "ulid"],
	}),
];

describe("fuzzyScore", () => {
	test("empty query scores zero", () => {
		expect(fuzzyScore("anything", "")).toBe(0);
	});

	test("exact prefix beats scattered letters", () => {
		expect(fuzzyScore("json formatter", "json")).toBeGreaterThan(
			fuzzyScore("join some other noise", "json"),
		);
	});

	test("typo-tolerant subsequence matches", () => {
		expect(fuzzyScore("json formatter", "jsn")).toBeGreaterThanOrEqual(0);
		expect(fuzzyScore("json formatter", "zzz")).toBe(-1);
	});

	test("case-insensitive", () => {
		expect(fuzzyScore("JSON Formatter", "jsn")).toBe(fuzzyScore("json formatter", "JSN"));
	});
});

describe("fuzzyFilterTools", () => {
	test("empty query keeps input order", () => {
		expect(fuzzyFilterTools(tools, "").map((t) => t.slug)).toEqual([
			"json-formatter",
			"text-cleaner",
			"uuid-generator",
		]);
	});

	test("finds json via typo", () => {
		const result = fuzzyFilterTools(tools, "jsn");
		expect(result[0]?.slug).toBe("json-formatter");
	});

	test("no match returns empty", () => {
		expect(fuzzyFilterTools(tools, "zzz-nope")).toEqual([]);
	});
});
