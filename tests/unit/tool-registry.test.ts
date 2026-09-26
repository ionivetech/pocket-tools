import { describe, expect, test } from "bun:test";
import { generatedToolDefinitions } from "../../app/data/tool-registry.generated";
import {
	createToolRegistry,
	ToolRegistryError,
	type ToolRegistryErrorCode,
} from "../../app/data/tool-registry";
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

function captureRegistryError(action: () => void): ToolRegistryError {
	try {
		action();
	} catch (error) {
		if (error instanceof ToolRegistryError) {
			return error;
		}
		throw error;
	}

	throw new Error("Expected ToolRegistryError");
}

function expectRegistryError(
	action: () => void,
	code: ToolRegistryErrorCode,
	details: Readonly<Record<string, string>>,
): ToolRegistryError {
	const error = captureRegistryError(action);
	expect(error.code).toBe(code);
	expect(error.details).toEqual(details);
	return error;
}

describe("tool registry", () => {
	test("registers, gets, and lists definitions", () => {
		const first = definition("first-tool");
		const second = definition("second-tool");
		const registry = createToolRegistry([first]);

		registry.register(second);

		expect(registry.get("first-tool")).toEqual(first);
		expect(registry.get("second-tool")).toEqual(second);
		expect(registry.list().map((tool) => tool.slug)).toEqual(["first-tool", "second-tool"]);
	});

	test("rejects duplicate slugs with a stable error", () => {
		const registry = createToolRegistry([definition("duplicate-tool")]);

		const error = expectRegistryError(
			() => registry.register(definition("duplicate-tool")),
			"duplicate_tool_slug",
			{ slug: "duplicate-tool" },
		);

		expect(error).toBeInstanceOf(ToolRegistryError);
		expect(registry.list()).toHaveLength(1);
	});

	test("rejects invalid metadata with the validator code", () => {
		const registry = createToolRegistry();
		const invalid = {
			...definition("invalid-tool"),
			category: "Utilities",
		} as unknown as ToolDefinition;

		const error = expectRegistryError(() => registry.register(invalid), "invalid_tool_definition", {
			validationCode: "invalid_tool_category",
			message: "Tool category is not supported",
		});

		expect(error).toBeInstanceOf(ToolRegistryError);
		expect(registry.get("invalid-tool")).toBeUndefined();
	});

	test("rejects definitions without a component loader", () => {
		const registry = createToolRegistry();
		const invalid = {
			...definition("missing-loader"),
			loadComponent: "missing",
		} as unknown as ToolDefinition;

		expectRegistryError(() => registry.register(invalid), "invalid_tool_definition", {
			validationCode: "invalid_tool_component_loader",
			message: "Tool component loader must be a function",
		});
	});

	test("returns undefined for an unknown slug", () => {
		expect(createToolRegistry().get("missing-tool")).toBeUndefined();
	});

	test("keeps list order stable after registration", () => {
		const registry = createToolRegistry([
			definition("charlie"),
			definition("alpha"),
			definition("bravo"),
		]);

		registry.register(definition("delta"));

		expect(registry.list().map((tool) => tool.slug)).toEqual([
			"charlie",
			"alpha",
			"bravo",
			"delta",
		]);
	});

	test("returns immutable lists and definitions", () => {
		const original = definition("immutable-tool", { keywords: ["original"] });
		const registry = createToolRegistry([original]);
		const listed = registry.list() as ToolDefinition[];
		const stored = registry.get("immutable-tool");

		if (!stored) {
			throw new Error("Expected registered tool");
		}

		expect(Object.isFrozen(listed)).toBe(true);
		expect(Object.isFrozen(stored)).toBe(true);
		expect(Object.isFrozen(stored.keywords)).toBe(true);
		expect(() => listed.pop()).toThrow();
		expect(() => {
			(stored as unknown as { name: string }).name = "Changed";
		}).toThrow();
		expect(() => {
			(stored as unknown as { keywords: string[] }).keywords[0] = "Changed";
		}).toThrow();
		expect(registry.get("immutable-tool")).toEqual(original);
	});
});
