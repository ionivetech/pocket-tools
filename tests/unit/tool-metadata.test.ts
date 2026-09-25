import { describe, expect, test } from "bun:test";
import { toolMetadata as colorPickerMetadata } from "../../app/tools/color-picker/metadata";
import { toolMetadata as jsonFormatterMetadata } from "../../app/tools/json-formatter/metadata";
import { toolMetadata as passwordGeneratorMetadata } from "../../app/tools/password-generator/metadata";
import { toolMetadata as textCleanerMetadata } from "../../app/tools/text-cleaner/metadata";
import { validateToolMetadata } from "../../app/types/tool";

const componentPath = "~/components/ToolPlaceholder.vue";

const expectedRecords = [
	{
		slug: "json-formatter",
		name: "JSON formatter",
		description: "Tidy messy JSON and spot errors at a glance.",
		category: "Developer",
		icon: "code",
		accent: "blue",
		keywords: ["json", "format", "validate", "developer"],
		componentPath,
	},
	{
		slug: "password-generator",
		name: "Password generator",
		description: "Create a strong password without leaving your browser.",
		category: "Everyday",
		icon: "lock",
		accent: "blue-strong",
		keywords: ["password", "security", "random", "everyday"],
		componentPath,
	},
	{
		slug: "color-picker",
		name: "Color picker",
		description: "Find a useful color and copy its values quickly.",
		category: "Media",
		icon: "palette",
		accent: "blue-soft",
		keywords: ["color", "hex", "rgb", "media"],
		componentPath,
	},
	{
		slug: "text-cleaner",
		name: "Text cleaner",
		description: "Clean up spacing and count what matters.",
		category: "Text",
		icon: "align-left",
		accent: "blue-muted",
		keywords: ["text", "clean", "count", "whitespace"],
		componentPath,
	},
] as const;

const invalidMetadata = [
	["slug", "JSON formatter", "invalid_tool_slug"],
	["name", " ", "invalid_tool_name"],
	["description", " ", "invalid_tool_description"],
	["category", "Utilities", "invalid_tool_category"],
	["icon", "sparkle", "invalid_tool_icon"],
	["keywords", "json", "invalid_tool_keywords"],
	["componentPath", "../Tool.vue", "invalid_tool_component_path"],
] as const;

describe("tool metadata", () => {
	test("preserves the current public tool records", () => {
		expect([
			jsonFormatterMetadata,
			passwordGeneratorMetadata,
			colorPickerMetadata,
			textCleanerMetadata,
		]).toEqual(expectedRecords);
	});

	test.each(expectedRecords)("validates the $slug record", (record) => {
		expect(validateToolMetadata(record)).toEqual({ ok: true, value: record });
	});

	test.each(invalidMetadata)("rejects invalid %s metadata", (field, value, code) => {
		const result = validateToolMetadata({ ...jsonFormatterMetadata, [field]: value });

		if (result.ok) {
			throw new Error(`Expected ${field} validation to fail`);
		}

		expect(result.error.code).toBe(code);
	});
});
