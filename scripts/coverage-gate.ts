#!/usr/bin/env bun
/**
 * Repo coverage gate, enforcing the new/modified split the project standard names.
 *
 * Bun 1.3.14 does enforce `[test.coverageThreshold]` natively, but only per-file, and the
 * unit suite dynamically imports generated modules from `$TMPDIR` (the hostile-input and
 * drift tests). Those ephemeral files land in the lcov report at 0%, so any native non-zero
 * threshold fails on test scaffolding rather than on repo quality. This gate therefore
 * aggregates itself and keeps only records that resolve inside the repository root.
 *
 * The thresholds below mirror the project's configured coverage standard in
 * `.mugiwara/config` -- `coverage_new=85` and `coverage_modified=90`. They are constants
 * here on purpose: `ci:local` must not fail because a config file is missing or
 * unparseable. The function floor is not named by that config, so it is carried over
 * unchanged from the previous gate: this gate may get stricter, never looser.
 *
 * The base is discovered at runtime as the merge-base with the repository's default branch
 * (`origin/HEAD`, else the first of `origin/main`, `origin/master`, `main`, `master` that
 * exists), so no base is baked in and no mission's bookkeeping leaks into repo tooling.
 * `COVERAGE_GATE_BASE` overrides it for a local run against any other range.
 *
 * Measured 2026-09-26 on branch feature/phase-1-core-infrastructure, against base
 * cbd3f2044aa6a93377a78953cb33de04592560e7, over the tree committed as
 * `fix(ci): enforce the configured new and modified coverage split`:
 *
 *   new       89.12% lines (1212/1360), 92.81% functions, 17 instrumented files
 *   modified 100.00% lines (42/42),   100.00% functions,  2 instrumented files
 *   aggregate 89.44% lines (1254/1402), 92.91% functions, 19 instrumented files
 *
 * This file is itself instrumented and counts toward the new class, which is deliberate: it
 * has no exemption from its own gate. Before the split was unit-tested it entered that
 * class at 69/129 lines (53.49%) and pulled it under the floor; it now stands at 306/343
 * (89.21%). Before the split existed at all, new code measured 84.99% (968/1139) against
 * the configured 85, and the gate then reported green on the more generous aggregate.
 *
 * Three limits stated rather than hidden:
 *
 * - A file never imported by a unit test is absent from lcov entirely, so the new class is
 *   blind to a new untested file. Uninstrumented diff files are printed, not swallowed.
 * - The split needs real git history. A shallow CI clone cannot resolve the base, and the
 *   gate then declares `*** AGGREGATE-ONLY MODE ***` on both streams, names the reason, and
 *   ends with `PASSED (AGGREGATE-ONLY -- the new/modified split was NOT enforced)` rather
 *   than a plain PASS. `COVERAGE_GATE_REQUIRE_SPLIT=1` turns that degradation into a
 *   failure. `.github/workflows/ci.yml` checks out with `fetch-depth: 0` so hosted CI
 *   enforces the split rather than the weaker fallback.
 * - An empty class is not a pass and not a failure: a diff with no modified code enforces
 *   only the new class and says so. A diff with neither is a failure, because a split that
 *   measured nothing must never read as a clean run.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Minimum covered-line ratio for NEW code, mirroring the project's configured coverage
 * standard `coverage_new` in `.mugiwara/config`.
 */
const MINIMUM_NEW_LINES = 0.85;

/**
 * Minimum covered-line ratio for MODIFIED code, mirroring `coverage_modified` in
 * `.mugiwara/config`.
 */
const MINIMUM_MODIFIED_LINES = 0.9;

/**
 * Minimum covered-function ratio for either class. `.mugiwara/config` names no function
 * floor, so this one is carried over unchanged from the previous gate: this gate may get
 * stricter, never looser.
 */
const MINIMUM_FUNCTIONS = 0.9;

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const coverageFile = resolve(repositoryRoot, "coverage/lcov.info");

export type CoverageRecord = {
	path: string;
	linesFound: number;
	linesHit: number;
	functionsFound: number;
	functionsHit: number;
};

export type CoverageRatio = {
	/** Instrumented files in scope; 0 means "no data", never "fully covered". */
	files: number;
	lines: number;
	functions: number;
};

export type CoverageMinimums = {
	lines: number;
	functions: number;
};

/** Which half of the diff a file belongs to. */
export type DiffKind = "new" | "modified";

/** Repo-relative path to its diff class. */
export type DiffClassification = Map<string, DiffKind>;

/** Repo records bucketed by diff class. */
export type DiffSplit = {
	new: CoverageRecord[];
	modified: CoverageRecord[];
};

/** What the gate reads, injected so every branch is reachable from a unit test. */
export type GateInputs = {
	/** Exit status of the test run that produced the lcov report. */
	testExitCode: number;
	/** Raw lcov report, or `undefined` when the report is missing. */
	lcov: string | undefined;
	/** `git diff --name-status <base>..HEAD`, or `undefined` when the base is unresolvable. */
	nameStatus: string | undefined;
	/** The diff range, for the report line. */
	base: string;
	/** Why the base could not be resolved, or `undefined` when it resolved. */
	baseError: string | undefined;
	/** Environment for the drill overrides. */
	environment: Record<string, string | undefined>;
};

/** Where the gate prints; injected so a test can assert on the wording. */
export type GateOutput = {
	log: (message: string) => void;
	error: (message: string) => void;
};

/** The outcome of resolving a diff range. */
export type DiffRange = {
	nameStatus: string | undefined;
	baseError: string;
};

function count(block: readonly string[], key: string): number {
	const prefix = `${key}:`;
	const line = block.find((candidate) => candidate.startsWith(prefix));
	return line === undefined ? 0 : Number(line.slice(prefix.length));
}

/** Parses an lcov report into per-file records. */
export function parseLcov(raw: string): CoverageRecord[] {
	const records: CoverageRecord[] = [];
	let block: string[] = [];

	const flush = (): void => {
		const path = block.find((line) => line.startsWith("SF:"))?.slice(3);
		if (path !== undefined) {
			records.push({
				path,
				linesFound: count(block, "LF"),
				linesHit: count(block, "LH"),
				functionsFound: count(block, "FNF"),
				functionsHit: count(block, "FNH"),
			});
		}
		block = [];
	};

	for (const line of raw.split("\n")) {
		if (line.trim() === "end_of_record") {
			flush();
			continue;
		}
		block.push(line);
	}

	return records;
}

/**
 * Keeps only records that resolve inside `root`, discarding anything the tests
 * generated under `$TMPDIR` or otherwise loaded from outside the repository.
 */
export function selectRepoRecords(
	records: readonly CoverageRecord[],
	root: string,
): CoverageRecord[] {
	return records.filter((record) => {
		const absolute = isAbsolute(record.path) ? record.path : resolve(root, record.path);
		const inside = relative(root, absolute);
		return inside !== "" && !inside.startsWith("..") && !isAbsolute(inside);
	});
}

/** Aggregates covered/total pairs into ratios over the given records. */
export function coverageRatio(records: readonly CoverageRecord[]): CoverageRatio {
	const total = (pick: (record: CoverageRecord) => number): number =>
		records.reduce((sum, record) => sum + pick(record), 0);
	const linesFound = total((record) => record.linesFound);
	const functionsFound = total((record) => record.functionsFound);
	const ratio = (hit: number, found: number): number => (found === 0 ? 0 : hit / found);

	return {
		files: records.length,
		lines: ratio(
			total((record) => record.linesHit),
			linesFound,
		),
		functions: ratio(
			total((record) => record.functionsHit),
			functionsFound,
		),
	};
}

/** Fails when any metric is below its minimum, and when there is no data at all. */
export function isCoverageAcceptable(ratio: CoverageRatio, minimums: CoverageMinimums): boolean {
	if (ratio.files === 0) {
		return false;
	}
	return ratio.lines >= minimums.lines && ratio.functions >= minimums.functions;
}

/**
 * Classifies `git diff --name-status` output. Added files and renames are new code (a
 * rename is measured under its new path); modified files are modified code; anything else,
 * including deletions, has nothing left to cover.
 *
 * @example
 * ```ts
 * parseNameStatus("A\tapp/utils/url-state.ts").get("app/utils/url-state.ts"); // "new"
 * ```
 */
export function parseNameStatus(raw: string): DiffClassification {
	const classification: DiffClassification = new Map();

	for (const line of raw.split("\n")) {
		const fields = line.split("\t");
		const status = fields[0] ?? "";
		const path = fields.at(-1);
		if (path === undefined || path === "" || status === "") {
			continue;
		}
		if (status.startsWith("A") || status.startsWith("R")) {
			classification.set(path, "new");
		} else if (status.startsWith("M")) {
			classification.set(path, "modified");
		}
	}

	return classification;
}

/** Buckets instrumented records by diff class; untouched files fall out of both lists. */
export function splitByDiff(
	records: readonly CoverageRecord[],
	classification: DiffClassification,
): DiffSplit {
	const split: DiffSplit = { new: [], modified: [] };

	for (const record of records) {
		const kind = classification.get(record.path);
		if (kind !== undefined) {
			split[kind].push(record);
		}
	}

	return split;
}

/**
 * The base the split is measured from: an explicit `COVERAGE_GATE_BASE`, else the
 * merge-base with the repository's default branch. A repo tool must not bake one
 * mission's bookkeeping into its behaviour, so no base is hardcoded here.
 */
export type BaseResolution = {
	/** The ref to diff from, or `undefined` when no base could be resolved. */
	base: string | undefined;
	/** Why no base could be resolved, or an empty string when one could. */
	baseError: string;
};

/** The default branch, from `origin/HEAD` or the first branch name that exists. */
function defaultBranch(cwd: string): string | undefined {
	const head = spawnSync(
		"git",
		["symbolic-ref", "--quiet", "--short", "refs/remotes/origin/HEAD"],
		{
			cwd,
			encoding: "utf8",
		},
	);
	const symbolic = head.stdout.trim().replace(/^origin\//, "");
	if (head.status === 0 && symbolic !== "") {
		return symbolic;
	}

	// `origin/HEAD` is not always set, and a CI checkout leaves no local branch at all,
	// so fall back to the names a GitHub-hosted default branch actually takes.
	for (const candidate of ["origin/main", "origin/master", "main", "master"]) {
		const exists = spawnSync("git", ["rev-parse", "--verify", "--quiet", candidate], { cwd });
		if (exists.status === 0) {
			return candidate;
		}
	}

	return undefined;
}

/**
 * Resolves the diff base. `COVERAGE_GATE_BASE` wins when set, so a local run can measure
 * any range -- the Phase 1 mission base, for instance, is
 * `COVERAGE_GATE_BASE=cbd3f20 bun run coverage:gate`.
 */
export function resolveBase(
	environment: Record<string, string | undefined>,
	cwd: string,
): BaseResolution {
	const override = environment["COVERAGE_GATE_BASE"];
	if (override !== undefined && override !== "") {
		return { base: override, baseError: "" };
	}

	const branch = defaultBranch(cwd);
	if (branch === undefined) {
		return {
			base: undefined,
			baseError:
				"no default branch could be discovered: origin/HEAD is unset and none of " +
				"origin/main, origin/master, main, master exists in this clone",
		};
	}

	const merge = spawnSync("git", ["merge-base", branch, "HEAD"], { cwd, encoding: "utf8" });
	const base = merge.stdout.trim();
	if (merge.status !== 0 || base === "") {
		return {
			base: undefined,
			baseError:
				`git merge-base ${branch} HEAD found no common ancestor ` +
				`(${merge.stderr.trim() || `git exited ${merge.status}`})`,
		};
	}

	return { base, baseError: "" };
}

/**
 * Resolves `<base>..HEAD`, or explains why it cannot. A shallow CI clone, a detached HEAD
 * with no such object, or a moved base all land here, and the caller must say so.
 */
export function readDiffRange(base: string, cwd: string): DiffRange {
	const fail = (baseError: string): DiffRange => ({ nameStatus: undefined, baseError });

	const known = spawnSync("git", ["cat-file", "-e", `${base}^{commit}`], { cwd, encoding: "utf8" });
	if (known.status !== 0) {
		return fail(
			`git cannot resolve the base ${base} in this clone ` +
				`(shallow clone, detached HEAD, or a missing ref): ` +
				(known.stderr.trim() || `git exited ${known.status}`),
		);
	}

	const diff = spawnSync("git", ["diff", "--name-status", `${base}..HEAD`], {
		cwd,
		encoding: "utf8",
	});
	if (diff.status !== 0) {
		return fail(
			`git diff ${base}..HEAD failed: ` + (diff.stderr.trim() || `git exited ${diff.status}`),
		);
	}

	return { nameStatus: diff.stdout, baseError: "" };
}

function percent(value: number): string {
	return `${(value * 100).toFixed(2)}%`;
}

function drillMinimum(
	environment: Record<string, string | undefined>,
	name: string,
	fallback: number,
): number {
	const raw = environment[name];
	if (raw === undefined) {
		return fallback;
	}
	const parsed = Number(raw);
	return Number.isFinite(parsed) ? parsed : fallback;
}

/** Prints one class and records every shortfall against its own minimums. */
function checkClass(
	out: GateOutput,
	label: string,
	ratio: CoverageRatio,
	minimums: CoverageMinimums,
	shortfalls: string[],
): boolean {
	out.log(
		`Coverage gate: ${label} ${percent(ratio.lines)} lines (min ${percent(minimums.lines)}), ` +
			`${percent(ratio.functions)} functions (min ${percent(minimums.functions)})`,
	);

	const failed: string[] = [];
	if (ratio.lines < minimums.lines) {
		failed.push(`${label} lines ${percent(ratio.lines)} is below ${percent(minimums.lines)}`);
	}
	if (ratio.functions < minimums.functions) {
		failed.push(
			`${label} functions ${percent(ratio.functions)} is below ${percent(minimums.functions)}`,
		);
	}
	shortfalls.push(...failed);

	return failed.length === 0;
}

/** The aggregate path used when the base ref is unresolvable. Never silent, never a plain PASS. */
function runAggregateOnly(inputs: GateInputs, out: GateOutput, ratio: CoverageRatio): number {
	const warning = [
		"Coverage gate: *** AGGREGATE-ONLY MODE ***",
		`Coverage gate: the base ref could not be resolved, so the new/modified split was NOT enforced.`,
		`Coverage gate: reason: ${inputs.baseError ?? "unknown"}`,
		"Coverage gate: this run is a weaker check than the configured standard. Set " +
			"COVERAGE_GATE_REQUIRE_SPLIT=1 to fail closed instead, or COVERAGE_GATE_BASE=<ref> " +
			"to name a base this clone can resolve.",
	];
	for (const line of warning) {
		out.error(line);
	}

	const minimums: CoverageMinimums = {
		lines: drillMinimum(inputs.environment, "COVERAGE_GATE_MIN_NEW_LINES", MINIMUM_NEW_LINES),
		functions: drillMinimum(inputs.environment, "COVERAGE_GATE_MIN_FUNCTIONS", MINIMUM_FUNCTIONS),
	};
	const shortfalls: string[] = [];
	checkClass(out, "aggregate", ratio, minimums, shortfalls);

	if (shortfalls.length > 0) {
		out.error(`Coverage gate FAILED (AGGREGATE-ONLY): ${shortfalls.join("; ")}`);
		return 1;
	}

	out.log("Coverage gate PASSED (AGGREGATE-ONLY — the new/modified split was NOT enforced)");
	return 0;
}

/** Runs the gate over injected inputs and returns the process exit code. */
export function runGate(inputs: GateInputs, out: GateOutput): number {
	if (inputs.testExitCode !== 0) {
		// Surface a red suite as a red suite rather than as a coverage verdict.
		out.error(`Coverage gate FAILED: test run failed with exit code ${inputs.testExitCode}`);
		return inputs.testExitCode;
	}

	if (inputs.lcov === undefined) {
		out.error(`Coverage gate FAILED: expected an lcov report at ${coverageFile}`);
		return 1;
	}

	const records = parseLcov(inputs.lcov);
	const repoRecords = selectRepoRecords(records, repositoryRoot);
	if (repoRecords.length === 0) {
		out.error("Coverage gate FAILED: no repository files were instrumented");
		return 1;
	}

	out.log(
		`Coverage gate: ${repoRecords.length} repo files, ` +
			`${records.length - repoRecords.length} files outside the repo ignored`,
	);

	if (inputs.nameStatus === undefined) {
		if (drillMinimum(inputs.environment, "COVERAGE_GATE_REQUIRE_SPLIT", 0) !== 0) {
			out.error(
				"Coverage gate FAILED: COVERAGE_GATE_REQUIRE_SPLIT is set and the base ref could " +
					`not be resolved. ${inputs.baseError ?? ""}`,
			);
			return 1;
		}
		return runAggregateOnly(inputs, out, coverageRatio(repoRecords));
	}

	const split = splitByDiff(repoRecords, parseNameStatus(inputs.nameStatus));
	if (split.new.length === 0 && split.modified.length === 0) {
		out.error(
			`Coverage gate FAILED: no instrumented files in the diff ${inputs.base}, so the ` +
				"new/modified split had nothing to measure",
		);
		return 1;
	}

	out.log(
		`Coverage gate: diff ${inputs.base}, ${split.new.length} new and ` +
			`${split.modified.length} modified instrumented files`,
	);
	const uninstrumented = [...parseNameStatus(inputs.nameStatus).keys()].filter(
		(path) =>
			// The tests themselves are never instrumented, and neither is the mission log; both
			// would drown the source files the split genuinely cannot see.
			!path.startsWith("tests/") &&
			!path.startsWith(".mugiwara/") &&
			!repoRecords.some((record) => record.path === path),
	);
	if (uninstrumented.length > 0) {
		out.log(
			`Coverage gate: ${uninstrumented.length} source diff files are absent from lcov, so ` +
				`the split cannot see them: ${uninstrumented.join(", ")}`,
		);
	}
	if (split.modified.length === 0) {
		out.log("Coverage gate: no modified files in the diff; only the new class is enforced");
	}
	if (split.new.length === 0) {
		out.log("Coverage gate: no new files in the diff; only the modified class is enforced");
	}

	const shortfalls: string[] = [];
	let acceptable = true;
	if (split.new.length > 0) {
		acceptable =
			checkClass(
				out,
				"new",
				coverageRatio(split.new),
				{
					lines: drillMinimum(inputs.environment, "COVERAGE_GATE_MIN_NEW_LINES", MINIMUM_NEW_LINES),
					functions: drillMinimum(
						inputs.environment,
						"COVERAGE_GATE_MIN_FUNCTIONS",
						MINIMUM_FUNCTIONS,
					),
				},
				shortfalls,
			) && acceptable;
	}
	if (split.modified.length > 0) {
		acceptable =
			checkClass(
				out,
				"modified",
				coverageRatio(split.modified),
				{
					lines: drillMinimum(
						inputs.environment,
						"COVERAGE_GATE_MIN_MODIFIED_LINES",
						MINIMUM_MODIFIED_LINES,
					),
					functions: drillMinimum(
						inputs.environment,
						"COVERAGE_GATE_MIN_FUNCTIONS",
						MINIMUM_FUNCTIONS,
					),
				},
				shortfalls,
			) && acceptable;
	}

	if (!acceptable) {
		out.error(`Coverage gate FAILED: ${shortfalls.join("; ")}`);
		return 1;
	}

	out.log("Coverage gate PASSED");
	return 0;
}

function main(): number {
	const resolved = resolveBase(process.env, repositoryRoot);
	const range =
		resolved.base === undefined ? undefined : readDiffRange(resolved.base, repositoryRoot);
	const baseError = resolved.baseError || range?.baseError || "";
	const base = resolved.base ?? "(unresolved)";

	const run = spawnSync(
		"bun",
		["test", "--coverage", "--coverage-reporter=text", "--coverage-reporter=lcov", "tests/unit"],
		{ cwd: repositoryRoot, stdio: "inherit" },
	);

	return runGate(
		{
			testExitCode: run.status ?? 1,
			lcov: existsSync(coverageFile) ? readFileSync(coverageFile, "utf8") : undefined,
			nameStatus: range?.nameStatus,
			base: `${base}..HEAD`,
			baseError: range?.nameStatus === undefined ? baseError : undefined,
			environment: process.env,
		},
		console,
	);
}

if (import.meta.main) {
	process.exit(main());
}
