import { describe, expect, test } from "bun:test";
import { toolMetadata as jsonFormatterMetadata } from "../../app/tools/json-formatter/metadata";
import { validateToolMetadata } from "../../app/types/tool";

/**
 * The pattern `isToolComponentPath` used to be, kept as a frozen oracle. The
 * per-tool branch now parses the path and delegates the slug half to `isToolSlug`
 * instead of re-encoding it, so this literal is the only remaining copy of the
 * old shape. Every verdict in `corpus` below was measured against this pattern.
 */
const legacyToolComponentPathPattern =
	/^(?:~\/components\/[A-Z][A-Za-z0-9]*\.vue|~\/tools\/[a-z0-9]+(?:-[a-z0-9]+)*\/ToolComponent\.vue)$/;

/**
 * A language lock, not a bug repro: the point is that swapping a pattern for a
 * parser accepts exactly the same set. A row flipping in either direction means
 * the accepted language moved, so widen the corpus and re-ask before shipping.
 */
const corpus = [
	// every shape the rule accepts today
	["~/components/ToolPlaceholder.vue", true],
	["~/components/ToolDualPane.vue", true],
	["~/tools/word-count/ToolComponent.vue", true],
	["~/tools/a/ToolComponent.vue", true],
	["~/tools/a-b-c/ToolComponent.vue", true],
	// the per-tool branch's near-misses
	["~/tools/Foo/ToolComponent.vue", false],
	["~/tools/word_count/ToolComponent.vue", false],
	["~/tools/word.count/ToolComponent.vue", false],
	["~/tools/../evil/ToolComponent.vue", false],
	["~/tools/a--b/ToolComponent.vue", false],
	["~/tools/-a/ToolComponent.vue", false],
	["~/tools/a-/ToolComponent.vue", false],
	["~/tools/word-count/Other.vue", false],
	["~/tools/a/b/ToolComponent.vue", false],
	["~/tools//ToolComponent.vue", false],
	["~/tools/ToolComponent.vue", false],
	["~/tools/~/tools/a/ToolComponent.vue", false],
	["~/tool/a/ToolComponent.vue", false],
	// nothing outside the closed allowlist: no absolute path, no scheme, no `//`
	["/app/components/Tool.vue", false],
	["https://evil.test/x.vue", false],
	["data:text/javascript,export default {}", false],
	["//evil/x.vue", false],
	[" ~/components/ToolPlaceholder.vue", false],
	["~/components/ToolPlaceholder.vue ", false],
	["~/tools/word-count/ToolComponent.vue\n", false],
	["~/tools/word-count/ToolComponent.vue\u0000", false],
	// the components branch's near-misses
	["~/components/toolPlaceholder.vue", false],
	["~/components/-Tool.vue", false],
	["~/components/1Tool.vue", false],
	["~/components/nested/Tool.vue", false],
	["~/components/Tool", false],
	["~/components/Tool_.vue", false],
	["~/components/.vue", false],
] as const;

function acceptsComponentPath(componentPath: unknown): boolean {
	return validateToolMetadata({ ...jsonFormatterMetadata, componentPath }).ok;
}

describe("tool component path rule", () => {
	test.each(corpus)("tool component path %j", (componentPath, expected) => {
		expect(legacyToolComponentPathPattern.test(componentPath)).toBe(expected);
		expect(acceptsComponentPath(componentPath)).toBe(expected);
	});

	test("refuses a component path that is not a string", () => {
		for (const componentPath of [null, undefined, 42, {}, [], true]) {
			const result = validateToolMetadata({ ...jsonFormatterMetadata, componentPath });

			if (result.ok) {
				throw new Error(`Expected ${JSON.stringify(componentPath) ?? "undefined"} to be refused`);
			}

			expect(result.error.code).toBe("invalid_tool_component_path");
			expect(result.error.message).toBe("Tool component path is invalid");
		}
	});
});
