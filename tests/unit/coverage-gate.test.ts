import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
	coverageRatio,
	parseNameStatus,
	isCoverageAcceptable,
	isInstrumentable,
	parseLcov,
	partitionAbsentFromLcov,
	readDiffRange,
	resolveBase,
	runGate,
	selectRepoRecords,
	splitByDiff,
	ABSENT_FROM_LCOV_ALLOWLIST,
	MINIMUM_FUNCTIONS,
	MINIMUM_MODIFIED_LINES,
	MINIMUM_NEW_LINES,
	UNINSTRUMENTABLE_EXTENSIONS,
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
		// A `.vue` file: Bun cannot instrument one, so it belongs in the reported-never-gating
		// bucket. An absent `.ts` used to sit in this same fixture, which asserted exit 0 -- the
		// exact hole this rule closes. The fixture moved; the test's purpose did not.
		const { out, log } = capture();

		expect(
			runGate(inputs({ nameStatus: "A\tapp/utils/url-state.ts\nA\tapp/untested.vue" }), out),
		).toBe(0);
		expect(log.join("\n")).toContain("app/untested.vue");
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

describe("coverage gate absent-from-lcov accounting", () => {
	// The hole this rule closes. A file no unit test imports never reaches lcov, so the
	// new/modified split cannot see it: an untested new module used to be reported and then
	// ignored, and the gate still said PASSED. These four tests pin both halves of the
	// partition -- a real source file absent from lcov is now a failure.
	const absentSource = "app/utils/absent-module.ts";

	test("fails and names a new .ts that the diff adds but lcov never instrumented", () => {
		const { out, log, error } = capture();
		const result = runGate(
			inputs({ nameStatus: `A\tapp/utils/url-state.ts\nA\t${absentSource}` }),
			out,
		);
		const printed = [...log, ...error].join("\n");

		expect(result).toBe(1);
		expect(printed).toContain(absentSource);
		// The reason has to be unambiguous: absent from lcov, therefore invisible to the split.
		expect(printed).toContain("absent from lcov");
		expect(printed).toContain("invisible");
		expect(printed).not.toContain("PASSED");
	});

	test("passes once the same file appears in lcov, so the rule tracks instrumentation", () => {
		const { out } = capture();
		const result = runGate(
			inputs({
				lcov: lcovOf(
					record("app/utils/url-state.ts", 100, 100),
					record(absentSource, 100, 100),
					record("app/data/tools.ts", 40, 40),
				),
				nameStatus: `A\tapp/utils/url-state.ts\nA\t${absentSource}\nM\tapp/data/tools.ts`,
			}),
			out,
		);

		expect(result).toBe(0);
	});

	test("reports a diff of only uninstrumentable extensions without gating on it", () => {
		// 12 .vue, 3 .md and one each of .yml/.json/.css/.d.ts cannot be instrumented by Bun at
		// all, so failing on them would be a permanent false red. They are named, and named as
		// reported-not-gating, rather than passed over in silence.
		//
		// One instrumented file stays in the diff on purpose: the pre-existing rule that a diff
		// measuring nothing at all is a failure is kept, and this test is about which *absent*
		// files are allowed to be absent, not about emptying the split.
		const { out, log } = capture();
		const result = runGate(
			inputs({
				nameStatus: [
					"A\tapp/utils/url-state.ts",
					"A\tapp/components/ToolHost.vue",
					"A\tREADME.md",
					"M\t.github/workflows/ci.yml",
					"M\tpackage.json",
					"M\tapp/assets/css/main.css",
					"A\tvue-shims.d.ts",
				].join("\n"),
			}),
			out,
		);
		const printed = log.join("\n");

		expect(result).toBe(0);
		for (const path of [
			"app/components/ToolHost.vue",
			"README.md",
			".github/workflows/ci.yml",
			"package.json",
			"app/assets/css/main.css",
			"vue-shims.d.ts",
		]) {
			expect(printed).toContain(path);
		}
		expect(printed).toContain("NOT gating");
	});

	test("passes an allowlisted absent source file and prints the reason it is allowed", () => {
		// Seeded entry: nuxt.config.ts is consumed by the Nuxt build, not by `bun test`.
		const { out, log } = capture();
		const result = runGate(
			inputs({ nameStatus: "A\tapp/utils/url-state.ts\nM\tnuxt.config.ts" }),
			out,
		);
		const printed = log.join("\n");

		expect(result).toBe(0);
		expect(printed).toContain("nuxt.config.ts");
		// The reason is part of the exemption, not a comment beside it.
		expect(printed).toContain("not by `bun test`");
	});

	test("fails an allowlist entry whose reason is empty or only whitespace", () => {
		// The failure mode a correct allowlist cannot demonstrate through runGate, so it is driven
		// at the partition that decides it. A blank reason excuses nothing, and the only way to
		// reach this state is for someone to have stopped maintaining the reasons.
		for (const reason of ["", "   ", "\n\t "]) {
			const absent = partitionAbsentFromLcov(
				["app/utils/rotting.ts"],
				new Set(),
				new Map([["app/utils/rotting.ts", reason]]),
			);

			expect(absent.reasonless).toEqual(["app/utils/rotting.ts"]);
			expect(absent.allowlisted).toEqual([]);
		}
	});

	test("accepts an allowlist entry that carries a real reason", () => {
		// The other half of the case above, so the test is not merely asserting a failure.
		const absent = partitionAbsentFromLcov(
			["app/utils/exempt.ts"],
			new Set(),
			new Map([["app/utils/exempt.ts", "covered by the production build"]]),
		);

		expect(absent.reasonless).toEqual([]);
		expect(absent.unaccounted).toEqual([]);
		expect(absent.allowlisted).toEqual([
			{ path: "app/utils/exempt.ts", reason: "covered by the production build" },
		]);
	});

	test("never gates on a file Bun cannot instrument, and gates on one it can", () => {
		// `.d.ts` is the trap: its last extension is `.ts`, so reading the tail would treat a
		// declarations file as instrumentable and make the gate permanently red.
		for (const path of [
			"vue-shims.d.ts",
			"app/types/tool.d.ts",
			"app/components/ToolHost.vue",
			"README.md",
			".github/workflows/ci.yml",
			"docs/notes.yaml",
			"package.json",
			"app/assets/css/main.css",
			"LICENSE",
		]) {
			expect(isInstrumentable(path)).toBe(false);
		}
		for (const path of [
			"nuxt.config.ts",
			"app/data/tool-routes.generated.ts",
			"scripts/coverage-gate.ts",
			"app/utils/url-state.mjs",
			"app/utils/url-state.cjs",
			"app/utils/url-state.jsx",
		]) {
			expect(isInstrumentable(path)).toBe(true);
		}
	});

	test("keeps the allowlist and the uninstrumentable set exactly as reviewed", () => {
		// Both lists are policy, so they are asserted by name. Widening either one to silence a
		// red gate has to change a test on purpose, which is the point.
		expect([...ABSENT_FROM_LCOV_ALLOWLIST.keys()].sort()).toEqual([
			"app/data/tool-routes.generated.ts",
			"nuxt.config.ts",
		]);
		for (const reason of ABSENT_FROM_LCOV_ALLOWLIST.values()) {
			expect(reason.trim()).not.toBe("");
		}
		expect(UNINSTRUMENTABLE_EXTENSIONS).toEqual([
			".vue",
			".md",
			".yml",
			".yaml",
			".json",
			".css",
			".d.ts",
		]);
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

describe("coverage gate malformed coverage data", () => {
	/** Replaces every `key:` count in a report with a non-numeric value. */
	function withCount(raw: string, key: string, value: string): string {
		return raw
			.split("\n")
			.map((line) => (line.startsWith(`${key}:`) ? `${key}:${value}` : line))
			.join("\n");
	}

	// F-09: a non-numeric count used to make the ratio NaN, and every `NaN < minimum` is false,
	// so the gate recorded no shortfall and printed PASSED over an entirely uncovered report.
	// The regression is the *exit code and the wording*, so both are asserted: the message must
	// name the offending record, and it must never print `NaN%` or a pass.
	for (const key of ["LF", "FNF"]) {
		test(`fails closed on a non-numeric ${key} and names the offending record`, () => {
			const { out, log, error } = capture();
			const result = runGate(
				inputs({ lcov: withCount(passingSplit.lcov, key, "not-a-number") }),
				out,
			);
			const printed = [...log, ...error].join("\n");

			expect(result).not.toBe(0);
			expect(result).toBe(1);
			expect(printed).toContain("app/utils/url-state.ts");
			expect(printed).toContain(key);
			expect(printed).not.toContain("NaN%");
			expect(printed).not.toContain("PASSED");
		});
	}

	test("reads an absent count as 0, so a truncated but valid report is still measured", () => {
		// The distinction that makes rejecting a non-numeric value safe: a *missing* key is a
		// truncated record and has always counted as 0. Only a present, unparseable value is
		// malformed, so this behaviour is unchanged and still fails closed on the ratio.
		const truncated = [
			"SF:app/utils/url-state.ts",
			"LF:100",
			"LH:100",
			"end_of_record",
			"SF:app/data/tools.ts",
			"LF:40",
			"LH:20",
			"FNF:4",
			"FNH:4",
			"end_of_record",
		].join("\n");

		expect(parseLcov(truncated)[0]).toEqual({
			path: "app/utils/url-state.ts",
			linesFound: 100,
			linesHit: 100,
			functionsFound: 0,
			functionsHit: 0,
		});

		// The absent FNF reads as 0, so the new class measures 0% functions and fails closed on
		// it. The truncation is measured, not waved past, and it is not an error.
		const { out, error } = capture();
		expect(runGate(inputs({ lcov: truncated }), out)).toBe(1);
		expect(error.join("\n")).toContain("new functions 0.00% is below 90.00%");
	});

	test("never accepts a non-finite ratio, because no NaN comparison can be trusted", () => {
		// The predicate the gate routes every verdict through. `NaN >= 0.85` is false, so the
		// old `>=` form failed closed by accident while the open-coded `<` form failed open.
		expect(
			isCoverageAcceptable(
				{ files: 1, lines: Number.NaN, functions: 1 },
				{ lines: 0.85, functions: 0.9 },
			),
		).toBe(false);
		expect(
			isCoverageAcceptable(
				{ files: 1, lines: 1, functions: Number.NaN },
				{ lines: 0.85, functions: 0.9 },
			),
		).toBe(false);
		expect(
			isCoverageAcceptable(
				{ files: 1, lines: Number.POSITIVE_INFINITY, functions: 1 },
				{ lines: 0.85, functions: 0.9 },
			),
		).toBe(false);
	});

	test("compares a ratio against its minimum in exactly one place", () => {
		// F-09's root cause was structural: `isCoverageAcceptable` was exported and unused by
		// `runGate`, which open-coded its own NaN-unsafe comparison. A second path cannot be
		// ruled out by a behavioural test alone, so this asserts the shape directly: no
		// comparison may be written against a ratio field anywhere in the gate.
		const source = readFileSync(resolve(import.meta.dir, "../../scripts/coverage-gate.ts"), "utf8");
		const openCoded = source.match(/ratio\.(lines|functions)\s*(?:<|<=|>|>=)/g) ?? [];

		expect(openCoded).toEqual([]);
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

describe("coverage gate floors against the configured standard", () => {
	const configPath = resolve(import.meta.dir, "../../.mugiwara/config");
	const configExists = existsSync(configPath);

	/**
	 * The floors `.mugiwara/config` names, as ratios. Throws when the file is there but does not
	 * name them: a present config that has drifted is drift, and must never be mistaken for the
	 * absent-config case that skips.
	 */
	function configuredFloors(path: string): { new: number; modified: number } {
		const read = (key: string): number => {
			const line = readFileSync(path, "utf8")
				.split("\n")
				.find((candidate) => candidate.startsWith(`${key}=`));
			const parsed = Number(line?.slice(key.length + 1));
			if (line === undefined || !Number.isFinite(parsed)) {
				throw new Error(`${path} does not name a finite ${key}`);
			}
			return parsed / 100;
		};

		return { new: read("coverage_new"), modified: read("coverage_modified") };
	}

	// Skip-over-fail is deliberate here. This gate ships as repo tooling and runs in clones that
	// have no `.mugiwara` directory at all, where a hard failure would be a red gate over a file
	// that does not exist. Where the config IS present -- this repo -- the mirror is enforced.
	// `skipIf` reports a visible `skip` in the tally, so an absent config is declared, not silent.
	test.skipIf(!configExists)("mirrors the configured new and modified coverage floors", () => {
		const configured = configuredFloors(configPath);

		expect(MINIMUM_NEW_LINES).toBeCloseTo(configured.new, 10);
		expect(MINIMUM_MODIFIED_LINES).toBeCloseTo(configured.modified, 10);
	});

	test.skipIf(!configExists)(
		"keeps a function floor that the configured floors would allow",
		() => {
			// The config names no function floor, so the constant is carried over. This asserts it
			// was not quietly dropped to whatever the line floors happen to be, and never exceeds
			// the stricter of the two: the gate may get stricter, never looser.
			expect(MINIMUM_FUNCTIONS).toBeGreaterThanOrEqual(0.9);
		},
	);

	test("reads the floors out of a config file", () => {
		const fixture = join(tmpdir(), "pockettools-config-fixture");
		writeFileSync(fixture, "mode=auto\ncoverage_new=85\ncoverage_modified=90\n");

		expect(configuredFloors(fixture)).toEqual({ new: 0.85, modified: 0.9 });
		rmSync(fixture, { force: true });
	});

	test("throws on a config that is present but does not name the floors", () => {
		// The skip is for an absent file only. Silence here would be the drift this test exists
		// to catch, so the absence of a floor is a failure, not a reason to skip.
		const fixture = join(tmpdir(), "pockettools-config-no-floors");
		writeFileSync(fixture, "mode=auto\nverbosity=normal\n");

		expect(() => configuredFloors(fixture)).toThrow(/coverage_new/);
		rmSync(fixture, { force: true });
	});
});
