import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
	coverageRatio,
	parseNameStatus,
	isCoverageAcceptable,
	parseLcov,
	readDiffRange,
	resolveBase,
	runGate,
	selectRepoRecords,
	splitByDiff,
	type GateInputs,
	type GateOutput,
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

/** A record that resolves outside the real repository root, whatever the test runs from. */
const outsideRecord = [
	"SF:../../../../var/folders/mh/T/pocket-tools-scaffold-ArZOiz/app/tools/word-count/logic.ts",
	"LF:20",
	"LH:0",
	"FNF:2",
	"FNH:0",
	"end_of_record",
].join("\n");

/**
 * Builds a record whose path is real, but whose coverage is whatever `hit` of `found` says.
 * Functions are always fully covered, so a test can isolate the line metric.
 */
function record(path: string, found: number, hit: number): string {
	return [`SF:${path}`, `LF:${found}`, `LH:${hit}`, "FNF:1", "FNH:1", "end_of_record"].join("\n");
}

function lcovOf(...records: string[]): string {
	return records.join("\n");
}

/** Captures everything the gate prints, so assertions can inspect the messages themselves. */
function capture(): { out: GateOutput; log: string[]; error: string[] } {
	const log: string[] = [];
	const error: string[] = [];
	return { out: { log: (m) => log.push(m), error: (m) => error.push(m) }, log, error };
}

/** A passing split fixture: one new file at 100%, one modified file at 100%. */
const passingSplit = {
	lcov: lcovOf(record("app/utils/url-state.ts", 100, 100), record("app/data/tools.ts", 40, 40)),
	nameStatus: ["A\tapp/utils/url-state.ts", "M\tapp/data/tools.ts"].join("\n"),
};

function inputs(overrides: Partial<GateInputs> = {}): GateInputs {
	return {
		testExitCode: 0,
		base: "cbd3f20..HEAD",
		baseError: undefined,
		environment: {},
		...passingSplit,
		...overrides,
	};
}

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

describe("coverage gate diff classification", () => {
	test("classifies added and renamed files as new, modified files as modified", () => {
		const classification = parseNameStatus(
			[
				"A\tapp/utils/url-state.ts",
				"M\tapp/data/tools.ts",
				"R097\ttests/e2e/pwa.spec.ts\ttests/e2e/pwa.pw.ts",
				"D\tapp/legacy/old.ts",
			].join("\n"),
		);

		expect(classification.get("app/utils/url-state.ts")).toBe("new");
		expect(classification.get("app/data/tools.ts")).toBe("modified");
		// A rename takes its coverage from the new path, so it is new code.
		expect(classification.get("tests/e2e/pwa.pw.ts")).toBe("new");
		// A deletion has nothing left to cover.
		expect(classification.has("app/legacy/old.ts")).toBe(false);
		expect(classification.has("tests/e2e/pwa.spec.ts")).toBe(false);
	});

	test("splits records into the new and modified classes, ignoring untouched files", () => {
		const records = selectRepoRecords(parseLcov(lcovFixture), root);
		const split = splitByDiff(
			records,
			parseNameStatus("A\tapp/utils/url-state.ts\nM\tapp/data/tool-registry.ts"),
		);

		expect(split.new.map((record) => record.path)).toEqual(["app/utils/url-state.ts"]);
		expect(split.modified.map((record) => record.path)).toEqual(["app/data/tool-registry.ts"]);

		const combined = coverageRatio([...split.new, ...split.modified]);
		expect(combined.lines).toBeCloseTo(128 / 140, 10);
	});
});

describe("coverage gate split enforcement", () => {
	test("reports new and modified separately and passes when both clear their own minimum", () => {
		const { out, log } = capture();

		expect(runGate(inputs(), out)).toBe(0);
		expect(log.join("\n")).toContain("new 100.00% lines");
		expect(log.join("\n")).toContain("modified 100.00% lines");
	});

	test("fails new code below 85 even when the aggregate would clear it", () => {
		// 80/100 new lines: the aggregate over both files is 120/140 = 85.71%, which clears the
		// old repo-wide floor, so only the per-class check can catch this. This is the F-2 case
		// the previous aggregate-only gate was blind to.
		const { out, log, error } = capture();
		const result = runGate(
			inputs({
				lcov: lcovOf(
					record("app/utils/url-state.ts", 100, 80),
					record("app/data/tools.ts", 40, 40),
				),
			}),
			out,
		);

		expect(result).toBe(1);
		expect(log.join("\n")).toContain("new 80.00% lines");
		expect(error.join("\n")).toContain("new lines 80.00% is below 85.00%");
	});

	test("fails modified code below 90", () => {
		const { out, error } = capture();
		const result = runGate(
			inputs({
				lcov: lcovOf(
					record("app/utils/url-state.ts", 100, 100),
					record("app/data/tools.ts", 100, 89),
				),
			}),
			out,
		);

		expect(result).toBe(1);
		expect(error.join("\n")).toContain("modified lines 89.00% is below 90.00%");
	});

	test("reports a diff file that was never instrumented instead of hiding it", () => {
		const { out, log } = capture();

		expect(
			runGate(inputs({ nameStatus: "A\tapp/utils/url-state.ts\nA\tapp/untested.ts" }), out),
		).toBe(0);
		expect(log.join("\n")).toContain("app/untested.ts");
	});

	test("enforces only the class that has files when the diff has no modified code", () => {
		const { out, log } = capture();

		expect(
			runGate(
				inputs({
					lcov: lcovOf(record("app/utils/url-state.ts", 100, 100)),
					nameStatus: "A\tapp/utils/url-state.ts",
				}),
				out,
			),
		).toBe(0);
		expect(log.join("\n")).toContain("no modified files");
	});

	test("fails when the diff classifies nothing, rather than passing an empty gate", () => {
		const { out, error } = capture();

		expect(runGate(inputs({ nameStatus: "" }), out)).toBe(1);
		expect(error.join("\n")).toContain("no instrumented files in the diff");
	});
});

describe("coverage gate failure modes", () => {
	test("surfaces a red test run as a red gate, never as a coverage verdict", () => {
		const { out, log, error } = capture();
		const result = runGate(inputs({ testExitCode: 3, lcov: undefined }), out);

		expect(result).toBe(3);
		expect(log).toEqual([]);
		expect(error.join("\n")).toContain("test run failed with exit code 3");
	});

	test("fails when the lcov report is missing", () => {
		const { out, error } = capture();

		expect(runGate(inputs({ lcov: undefined }), out)).toBe(1);
		expect(error.join("\n")).toContain("expected an lcov report");
	});

	test("fails on an empty lcov report", () => {
		const { out, error } = capture();

		expect(runGate(inputs({ lcov: "" }), out)).toBe(1);
		expect(error.join("\n")).toContain("no repository files were instrumented");
	});

	test("fails when every record is outside the repository", () => {
		const { out, error } = capture();

		expect(runGate(inputs({ lcov: outsideRecord }), out)).toBe(1);
		expect(error.join("\n")).toContain("no repository files were instrumented");
	});

	test("honours a drill override, so an impossible threshold fails the gate", () => {
		const { out, error } = capture();

		expect(runGate(inputs({ environment: { COVERAGE_GATE_MIN_NEW_LINES: "1.01" } }), out)).toBe(1);
		expect(error.join("\n")).toContain("new lines 100.00% is below 101.00%");
	});
});

describe("coverage gate base-ref fallback", () => {
	const unavailable = inputs({
		nameStatus: undefined,
		baseError: "git cannot resolve the base deadbeef in this clone",
	});

	test("declares aggregate-only mode loudly and never claims the split passed", () => {
		const { out, log, error } = capture();
		const result = runGate(unavailable, out);
		const printed = [...log, ...error].join("\n");

		expect(result).toBe(0);
		expect(printed).toContain("AGGREGATE-ONLY");
		expect(printed).toContain("the new/modified split was NOT enforced");
		expect(printed).not.toContain("new 100.00% lines");
	});

	test("still fails aggregate-only mode when the aggregate is below the standard", () => {
		const { out, error } = capture();

		expect(
			runGate(
				{
					...unavailable,
					lcov: lcovOf(
						record("app/utils/url-state.ts", 100, 70),
						record("app/data/tools.ts", 40, 40),
					),
				},
				out,
			),
		).toBe(1);
		expect(error.join("\n")).toContain("AGGREGATE-ONLY");
	});

	test("fails closed when the caller demands the split and the base is unresolvable", () => {
		const { out, error } = capture();

		expect(
			runGate({ ...unavailable, environment: { COVERAGE_GATE_REQUIRE_SPLIT: "1" } }, out),
		).toBe(1);
		expect(error.join("\n")).toContain("COVERAGE_GATE_REQUIRE_SPLIT");
	});
});

describe("coverage gate diff range resolution", () => {
	const repoRoot = resolve(import.meta.dir, "../..");

	test("resolves a base this clone knows, against HEAD", () => {
		const range = readDiffRange("cbd3f20", repoRoot);

		expect(range.baseError).toBe("");
		// The mission base is real, so the split has something to measure.
		expect(range.nameStatus).toContain("scripts/coverage-gate.ts");
	});

	test("explains an unresolvable base instead of returning an empty diff", () => {
		const range = readDiffRange("0".repeat(40), repoRoot);

		expect(range.nameStatus).toBeUndefined();
		expect(range.baseError).toContain("git cannot resolve the base");
	});
});

describe("coverage gate base discovery", () => {
	const repoRoot = resolve(import.meta.dir, "../..");

	test("defaults to the merge-base with the default branch, hardcoding nothing", () => {
		const resolved = resolveBase({}, repoRoot);

		expect(resolved.baseError).toBe("");
		// A real commit, and the same ancestor the mission recorded as its base.
		expect(resolved.base).toMatch(/^[0-9a-f]{40}$/);
		expect(readDiffRange(resolved.base as string, repoRoot).nameStatus).toContain(
			"scripts/coverage-gate.ts",
		);
	});

	test("honours an explicit override without consulting git for a default", () => {
		const resolved = resolveBase({ COVERAGE_GATE_BASE: "cbd3f20" }, "/nonexistent-repo");

		expect(resolved.base).toBe("cbd3f20");
		expect(resolved.baseError).toBe("");
	});

	test("explains a repository with no discoverable default branch", () => {
		const empty = mkdtempSync(join(tmpdir(), "coverage-gate-no-"));
		spawnSync("git", ["init", "--quiet"], { cwd: empty });

		const resolved = resolveBase({}, empty);

		expect(resolved.base).toBeUndefined();
		expect(resolved.baseError).toContain("no default branch could be discovered");
		rmSync(empty, { recursive: true, force: true });
	});
});
