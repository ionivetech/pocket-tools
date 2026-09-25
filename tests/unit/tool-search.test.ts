import { describe, expect, test } from "bun:test";
import { createToolRegistry } from "../../app/data/tool-registry";
import { filterTools } from "../../app/data/tool-search";
import { generatedToolDefinitions } from "../../app/data/tool-registry.generated";
import type { ToolDefinition } from "../../app/types/tool";

const [baseDefinition] = generatedToolDefinitions;

if (!baseDefinition) {
	throw new Error("Expected generated tool definitions");
}

function definition(slug: string, overrides: Partial<ToolDefinition> = {}): ToolDefinition {
	return {
		...baseDefinition,
		slug,
		name: slug,
		description: `Description for ${slug}`,
		category: "Text",
		keywords: [slug],
		...overrides,
	};
}

const searchableTools: readonly ToolDefinition[] = [
	definition("json-formatter", {
		name: "JSON formatter",
		description: "Formats nested data",
		category: "Developer",
		keywords: ["schema"],
	}),
	definition("password-generator", {
		name: "Password generator",
		description: "Creates a strong secret",
		category: "Everyday",
		keywords: ["security"],
	}),
	definition("color-picker", {
		name: "Color picker",
		description: "Copies useful values",
		category: "Media",
		keywords: ["hex"],
	}),
];

const fieldMatches = [
	["json", "json-formatter"],
	["NESTED", "json-formatter"],
	["developer", "json-formatter"],
	["sChEmA", "json-formatter"],
] as const;

describe("tool search", () => {
	test.each(fieldMatches)("matches %s case-insensitively", (query, expectedSlug) => {
		expect(
			filterTools(searchableTools, { query, category: "All" }).map((tool) => tool.slug),
		).toEqual([expectedSlug]);
	});

	test("treats All as no category filter", () => {
		expect(
			filterTools(searchableTools, { query: "json", category: "All" }).map((tool) => tool.slug),
		).toEqual(["json-formatter"]);
	});

	test("returns no matches for an unknown category", () => {
		expect(filterTools(searchableTools, { query: "", category: "Archive" })).toEqual([]);
	});

	test("trims meaningful queries and treats whitespace-only queries as empty", () => {
		expect(
			filterTools(searchableTools, { query: " \t sChEmA \n ", category: "All" }).map(
				(tool) => tool.slug,
			),
		).toEqual(["json-formatter"]);
		expect(
			filterTools(searchableTools, { query: " \t\n ", category: "All" }).map((tool) => tool.slug),
		).toEqual(["json-formatter", "password-generator", "color-picker"]);
	});

	test("does not mutate the input collection or its definitions", () => {
		const input = [...searchableTools];
		const originalSlugs = input.map((tool) => tool.slug);
		const originalKeywords = input[0]?.keywords.slice() ?? [];

		const result = filterTools(input, { query: "schema", category: "Developer" });

		expect(result).not.toBe(input);
		expect(input.map((tool) => tool.slug)).toEqual(originalSlugs);
		expect(input[0]?.keywords).toEqual(originalKeywords);
	});

	test("filters 1,000 registered records deterministically", () => {
		const categories = ["Everyday", "Text", "Developer", "Media"] as const;
		const scaleTools = Array.from({ length: 1_000 }, (_, index) => {
			const suffix = index.toString().padStart(4, "0");
			return definition(`scale-${suffix}`, {
				name: `Tool ${suffix}`,
				description: `Record ${suffix}`,
				category: categories[index % categories.length] ?? "Text",
				keywords: [index % 100 === 0 ? "needle" : "utility"],
			});
		});
		const definitions = createToolRegistry(scaleTools).list();

		for (const category of categories) {
			expect(filterTools(definitions, { query: "", category })).toHaveLength(250);
		}

		expect(
			filterTools(definitions, { query: " NeEdLe ", category: "All" }).map((tool) => tool.slug),
		).toEqual([
			"scale-0000",
			"scale-0100",
			"scale-0200",
			"scale-0300",
			"scale-0400",
			"scale-0500",
			"scale-0600",
			"scale-0700",
			"scale-0800",
			"scale-0900",
		]);
	});
});
