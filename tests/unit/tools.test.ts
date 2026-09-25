import { describe, expect, test } from "bun:test";
import { findTool, toolCategories, tools } from "../../app/data/tools";

describe("tool registry", () => {
	test("keeps a stable searchable catalog", () => {
		expect(tools.length).toBeGreaterThan(0);
		expect(toolCategories[0]).toBe("All");
		expect(tools.every((tool) => tool.slug && tool.name && tool.keywords.length > 0)).toBe(true);
	});

	test("resolves a tool by slug", () => {
		const tool = findTool("password-generator");
		expect(tool?.name).toBe("Password generator");
		expect(findTool("missing-tool")).toBeUndefined();
	});

	test("keeps local icon identifiers free of PrimeIcons classes", () => {
		expect(tools.every((tool) => /^[a-z][a-z-]*$/.test(tool.icon))).toBe(true);
	});
});
