import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import {
	coverageRatio,
	isCoverageAcceptable,
	parseLcov,
	selectRepoRecords,
} from "../../scripts/coverage-gate";

const root = resolve("/repo");

const lcovFixture = [
	"SF:app/utils/url-state.ts",
	"LF:100",
	"LH:98",
	"FNF:10",
	"FNH:10",
	"end_of_record",
	// Ephemeral module that tests dynamically import() out of $TMPDIR.
	"SF:../../../../var/folders/mh/T/pocket-tools-scaffold-ArZOiz/app/tools/word-count/logic.ts",
	"LF:20",
	"LH:0",
	"FNF:2",
	"FNH:0",
	"end_of_record",
	"SF:app/data/tool-registry.ts",
	"LF:40",
	"LH:30",
	"FNF:4",
	"FNH:2",
	"end_of_record",
].join("\n");

describe("coverage gate", () => {
	test("parses lcov records", () => {
		expect(parseLcov(lcovFixture)).toEqual([
			{
				path: "app/utils/url-state.ts",
				linesFound: 100,
				linesHit: 98,
				functionsFound: 10,
				functionsHit: 10,
			},
			{
				path: "../../../../var/folders/mh/T/pocket-tools-scaffold-ArZOiz/app/tools/word-count/logic.ts",
				linesFound: 20,
				linesHit: 0,
				functionsFound: 2,
				functionsHit: 0,
			},
			{
				path: "app/data/tool-registry.ts",
				linesFound: 40,
				linesHit: 30,
				functionsFound: 4,
				functionsHit: 2,
			},
		]);
	});

	test("ignores every record outside the repository root", () => {
		expect(selectRepoRecords(parseLcov(lcovFixture), root).map((record) => record.path)).toEqual([
			"app/utils/url-state.ts",
			"app/data/tool-registry.ts",
		]);
	});

	test("measures the aggregate over repo files only", () => {
		const ratio = coverageRatio(selectRepoRecords(parseLcov(lcovFixture), root));

		// 128/140 lines and 12/14 functions, never the 0% ephemeral file.
		expect(ratio.lines).toBeCloseTo(128 / 140, 10);
		expect(ratio.functions).toBeCloseTo(12 / 14, 10);
	});

	test("fails below a minimum and passes at or above it", () => {
		const ratio = coverageRatio(selectRepoRecords(parseLcov(lcovFixture), root));
		const minimums = { lines: 0.9, functions: 0.9 };

		expect(isCoverageAcceptable(ratio, minimums)).toBe(false);
		expect(isCoverageAcceptable(ratio, { lines: 0.85, functions: 0.85 })).toBe(true);
		expect(isCoverageAcceptable(ratio, { lines: 128 / 140, functions: 12 / 14 })).toBe(true);
	});

	test("treats a repo with no instrumented lines as a failure, not a pass", () => {
		expect(isCoverageAcceptable(coverageRatio([]), { lines: 0, functions: 0 })).toBe(false);
	});
});
