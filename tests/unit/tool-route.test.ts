import { describe, expect, test } from "bun:test";
import { resolveToolRoute } from "../../app/data/tool-route";
import type { ToolDefinition } from "../../app/types/tool";

const definitions: readonly ToolDefinition[] = [
	{
		slug: "json-formatter",
		name: "JSON formatter",
		description: "Format JSON in your browser.",
		category: "Developer",
		icon: "code",
		accent: "blue",
		keywords: ["json"],
		componentPath: "~/components/ToolPlaceholder.vue",
		loadComponent: async () => ({ render: () => null }),
	},
	{
		slug: "text-cleaner",
		name: "Text cleaner",
		description: "Clean up text in your browser.",
		category: "Text",
		icon: "align-left",
		accent: "blue-soft",
		keywords: ["text"],
		componentPath: "~/components/ToolPlaceholder.vue",
		loadComponent: async () => ({ render: () => null }),
	},
];

const notFound = {
	ok: false,
	error: {
		code: "tool_not_found",
		statusCode: 404,
		message: "Tool not found",
	},
} as const;

describe("tool route resolution", () => {
	test("resolves known slugs to their registered definition", () => {
		for (const definition of definitions) {
			expect(resolveToolRoute(definition.slug, definitions)).toEqual({
				ok: true,
				value: definition,
			});
		}
	});

	test("normalizes string slugs before lookup", () => {
		expect(resolveToolRoute("  JSON-FORMATTER  ", definitions)).toEqual({
			ok: true,
			value: definitions[0],
		});
	});

	test.each([
		{ label: "an unknown slug", slug: "missing" },
		{ label: "an empty slug", slug: "" },
		{ label: "a whitespace slug", slug: "   " },
		{ label: "an array", slug: ["json-formatter"] },
		{ label: "an object", slug: {} },
		{ label: "a missing slug", slug: undefined },
		{ label: "null", slug: null },
		{ label: "a number", slug: 42 },
	])("returns the stable not-found result for $label", ({ slug }) => {
		expect(resolveToolRoute(slug, definitions)).toEqual(notFound);
	});

	test("does not mutate the registry input", () => {
		const input = [...definitions];
		const snapshot = structuredClone(
			input.map(({ loadComponent: _loadComponent, ...definition }) => definition),
		);

		resolveToolRoute("missing", input);
		resolveToolRoute("  JSON-FORMATTER  ", input);

		expect(input).toEqual(definitions);
		expect(input.map(({ loadComponent: _loadComponent, ...definition }) => definition)).toEqual(
			snapshot,
		);
	});
});
