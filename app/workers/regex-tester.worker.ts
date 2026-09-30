/**
 * Runs a user-supplied regex off the main thread.
 *
 * A catastrophic pattern like `(a+)+$` against a long sample freezes the tab for
 * tens of seconds, and the pattern arrives in the URL on a share link, so this is
 * reachable before the user types anything. Input caps cannot prevent it: a short
 * pattern and a short sample are enough. The only real bound is a thread the UI
 * can abandon, so the matching itself lives here and the component terminates this
 * worker when it overruns.
 *
 * The matching logic is not duplicated: it imports the same `runRegexTester` the
 * unit tests exercise, so both paths run identical code.
 */
import { runRegexTester } from "../tools/regex-tester/logic";
import type { RegexTesterInput } from "../tools/regex-tester/schema";

export type RegexWorkerRequest = Readonly<{ id: number; input: RegexTesterInput }>;

export type RegexWorkerResponse = Readonly<{
	id: number;
	result: ReturnType<typeof runRegexTester>;
}>;

self.addEventListener("message", (event: MessageEvent<RegexWorkerRequest>) => {
	const { id, input } = event.data;
	// Reported back rather than thrown: a worker exception would arrive as an
	// opaque `error` event with no message, which is useless in the UI.
	postMessage({ id, result: runRegexTester(input) } satisfies RegexWorkerResponse);
});
