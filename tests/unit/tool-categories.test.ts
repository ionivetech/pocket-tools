import { describe, expect, test } from "bun:test";
import { toolCategories } from "../../app/data/tools";
import { toolCategoryValues } from "../../app/types/tool";
import { parseScaffoldArgs } from "../../scripts/scaffold-tool-args";

function scaffoldArguments(category: string): readonly string[] {
	return [
		"--slug",
		"word-count",
		"--name",
		"Word count",
		"--description",
		"Count words and characters in your text.",
		"--category",
		category,
	];
}

describe("tool categories", () => {
	test("lists the canonical categories without duplicates", () => {
		expect(new Set(toolCategoryValues).size).toBe(toolCategoryValues.length);
	});

	test("derives the filter list from the canonical list", () => {
		expect(toolCategories).toEqual(["All", ...toolCategoryValues]);
	});

	test("scaffolder accepts every canonical category", () => {
		for (const category of toolCategoryValues) {
			const result = parseScaffoldArgs(scaffoldArguments(category));

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.category).toBe(category);
			}
		}
	});

	test("scaffolder still rejects a category outside the canonical list", () => {
		const result = parseScaffoldArgs(scaffoldArguments("Productivity"));

		if (result.ok) {
			throw new Error("Expected an unknown category to be rejected");
		}

		expect(result.error.code).toBe("invalid_category");
		expect(result.error.message).toContain(toolCategoryValues.join(", "));
	});
});
