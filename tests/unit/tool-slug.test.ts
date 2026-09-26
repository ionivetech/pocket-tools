import { describe, expect, test } from "bun:test";
import { isToolSlug } from "../../app/types/tool";
import { parseScaffoldArgs } from "../../scripts/scaffold-tool-args";

function scaffoldArguments(slug: string): readonly string[] {
	return [
		"--slug",
		slug,
		"--name",
		"Word count",
		"--description",
		"Count words and characters in your text.",
		"--category",
		"Text",
	];
}

/** The rule and its verdicts. Every row must be decided the same way by both call sites. */
const slugCases = [
	["word-count", true],
	["Word-Count", false],
	["-word-count", false],
	["word-count-", false],
	["word--count", false],
	["word.count", false],
	["", false],
] as const;

describe("tool slug rule", () => {
	// A property lock, not a bug repro. The validator and the scaffolder each used to
	// hold their own copy of this rule, so the thing worth guarding is that they still
	// decide every case identically: editing one site alone has to fail this test.
	test.each(slugCases)("%j is accepted: %s", (slug, accepted) => {
		expect(isToolSlug(slug)).toBe(accepted);

		const result = parseScaffoldArgs(scaffoldArguments(slug));

		expect(result.ok).toBe(accepted);
		if (!result.ok) {
			expect(result.error.code).toBe("invalid_slug");
			return;
		}
		expect(result.value.slug).toBe(slug);
	});
});
