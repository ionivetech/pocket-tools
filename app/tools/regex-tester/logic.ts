import type { Result } from "../../types/tool";
import {
	REGEX_PATTERN_MAX,
	REGEX_SAMPLE_MAX,
	parseRegexTesterInput,
	type RegexTesterInput,
} from "./schema";

export const REGEX_MATCH_CAP = 100;

export type RegexMatch = Readonly<{
	index: number;
	text: string;
	groups: readonly (string | null)[];
}>;

export type RegexTesterOutput = Readonly<{
	matches: readonly RegexMatch[];
	truncated: boolean;
}>;

export type RegexTesterErrorCode = "empty_input" | "input_too_large" | "invalid_pattern";

/**
 * Tests a JS search pattern against sample text. Always scans globally so the
 * UI lists every match; catastrophic patterns are bounded by input caps and a
 * 100-match ceiling rather than by timing the event loop.
 *
 * @example
 * ```ts
 * runRegexTester({ pattern: "\\d+", flags: "", sample: "a1b22" }).value.matches.length; // 2
 * runRegexTester({ pattern: "(", flags: "", sample: "" }).error.code; // "invalid_pattern"
 * ```
 */
export function runRegexTester(input: RegexTesterInput): Result<RegexTesterOutput> {
	const validated = parseRegexTesterInput(input);
	if (!validated.ok) {
		return validated;
	}
	const { pattern, flags, sample } = validated.value;
	if (pattern === "") {
		return {
			ok: false,
			error: { code: "empty_input", message: "Type a search pattern first." },
		};
	}
	if (pattern.length > REGEX_PATTERN_MAX || sample.length > REGEX_SAMPLE_MAX) {
		return {
			ok: false,
			error: {
				code: "input_too_large",
				message: `Keep patterns under ${REGEX_PATTERN_MAX} characters and samples under ${REGEX_SAMPLE_MAX}.`,
			},
		};
	}

	let expression: RegExp;
	try {
		expression = new RegExp(pattern, flags.includes("g") ? flags : `${flags}g`);
	} catch {
		return {
			ok: false,
			error: {
				code: "invalid_pattern",
				message: "That pattern does not compile. Check brackets and escapes.",
			},
		};
	}

	const matches: RegexMatch[] = [];
	let truncated = false;
	for (const match of sample.matchAll(expression)) {
		if (matches.length >= REGEX_MATCH_CAP) {
			truncated = true;
			break;
		}
		matches.push({
			index: match.index ?? 0,
			text: match[0] ?? "",
			groups: (match.slice(1) as (string | undefined)[]).map((group) =>
				group === undefined ? null : group,
			),
		});
	}
	return { ok: true, value: { matches, truncated } };
}
