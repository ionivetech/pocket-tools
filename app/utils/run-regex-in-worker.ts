import type { Result } from "../types/tool";
import type { RegexTesterOutput } from "../tools/regex-tester/logic";
import type { RegexWorkerRequest, RegexWorkerResponse } from "../workers/regex-tester.worker";
import { parseRegexTesterInput, type RegexTesterInput } from "../tools/regex-tester/schema";

/**
 * How long a pattern may run before the UI gives up on it.
 *
 * This is measured from the moment the request is posted, so it includes the
 * worker's first module evaluation. That cost is real and one-off, which is why
 * the worker is shared below rather than rebuilt per keystroke: a cold spawn
 * measured ~1.4s under `bun test`, and paying that against a 2s bound would
 * report ordinary patterns as too slow.
 */
export const REGEX_RUN_TIMEOUT_MS = 2000;

export type RegexTesterErrorCode =
	| "empty_input"
	| "invalid_pattern"
	| "input_too_large"
	| "pattern_too_slow";

/**
 * Tests a pattern in a worker that can be abandoned.
 *
 * The event loop cannot be timed, so a bound has to come from somewhere that can
 * be killed. This validates cheaply on the calling thread (empty pattern, caps,
 * compile failure — all instant) and only hands real work to the worker, so the
 * common cases never pay for a thread.
 *
 * @example
 * runRegexTesterAsync({ pattern: "\\d+", flags: "", sample: "a1b22" }).then((r) => r.ok); // true
 * await runRegexTesterAsync({ pattern: "(", flags: "", sample: "" }); // invalid_pattern, no worker
 */
export async function runRegexTesterAsync(
	input: RegexTesterInput,
): Promise<Result<RegexTesterOutput>> {
	// A pattern that does not compile, is empty, or breaks the caps fails the
	// same way it always did, and can be decided without a worker.
	const precheck = validateOnly(input);
	if (precheck) {
		return precheck;
	}

	if (typeof Worker === "undefined") {
		return {
			ok: false,
			error: {
				code: "pattern_too_slow",
				message: "This browser cannot run patterns safely. Keep samples short.",
			},
		};
	}

	const worker = sharedWorker();
	const id = nextRequestId();

	return new Promise<Result<RegexTesterOutput>>((resolve) => {
		const finish = (result: Result<RegexTesterOutput>): void => {
			clearTimeout(timer);
			// A timed-out run leaves a thread spinning in a pattern, so that worker
			// is gone for good; the next run builds a fresh one. A reply, by
			// contrast, leaves the worker healthy and reusable.
			if (!result.ok && result.error.code === "pattern_too_slow") {
				dropSharedWorker();
			}
			resolve(result);
		};
		const timer = setTimeout(() => {
			finish({
				ok: false,
				error: {
					code: "pattern_too_slow",
					message: `That pattern was still running after ${REGEX_RUN_TIMEOUT_MS / 1000} seconds, so it was stopped. Patterns like nested repeats can be extremely slow.`,
				},
			});
		}, REGEX_RUN_TIMEOUT_MS);

		worker.addEventListener("message", (event: MessageEvent<RegexWorkerResponse>) => {
			if (event.data.id === id) {
				finish(event.data.result);
			}
		});
		worker.addEventListener("error", () => {
			dropSharedWorker();
			finish({
				ok: false,
				error: {
					code: "pattern_too_slow",
					message: "The pattern runner failed to start, so it was stopped.",
				},
			});
		});

		worker.postMessage({ id, input } satisfies RegexWorkerRequest);
	});
}

/**
 * One worker for the tool's lifetime. Spawning per keystroke would pay module
 * evaluation on every debounce tick, and that cost is charged against the
 * timeout above — a fast pattern would get reported as slow on a cold worker.
 */
let shared: Worker | null = null;
let lastRequestId = 0;

function sharedWorker(): Worker {
	shared ??= new Worker(new URL("../workers/regex-tester.worker.ts", import.meta.url), {
		type: "module",
	});
	return shared;
}

function dropSharedWorker(): void {
	shared?.terminate();
	shared = null;
}

function nextRequestId(): number {
	lastRequestId += 1;
	return lastRequestId;
}

/**
 * The instant, worker-free rejections from `runRegexTester`: an empty pattern,
 * a broken pattern, or an oversized input. Returns null when real work is needed.
 */
function validateOnly(input: RegexTesterInput): Result<RegexTesterOutput> | null {
	const validated = parseRegexTesterInput(input);
	if (!validated.ok) {
		return validated;
	}
	try {
		// Same construction the worker will do, so a bad pattern is still caught
		// here rather than costing a thread spawn.
		// biome-ignore lint: constructed only to validate, never used to match
		new RegExp(validated.value.pattern, validated.value.flags);
	} catch {
		return {
			ok: false,
			error: {
				code: "invalid_pattern",
				message: "That pattern does not compile. Check brackets and escapes.",
			},
		};
	}
	if (validated.value.pattern === "") {
		return {
			ok: false,
			error: { code: "empty_input", message: "Type a search pattern first." },
		};
	}
	return null;
}
