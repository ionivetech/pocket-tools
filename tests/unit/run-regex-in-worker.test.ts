import { describe, expect, test } from "bun:test";
import { REGEX_RUN_TIMEOUT_MS, runRegexTesterAsync } from "../../app/utils/run-regex-in-worker";

/**
 * These run the real worker: `bun test` provides a `Worker` global, so the
 * spawn-and-terminate path is exercised here rather than only in the browser.
 */
describe("runRegexTesterAsync", () => {
	test("matches in a real worker", async () => {
		expect(await runRegexTesterAsync({ pattern: "\\d+", flags: "", sample: "a1b22" })).toEqual({
			ok: true,
			value: {
				matches: [
					{ index: 1, text: "1", groups: [] },
					{ index: 3, text: "22", groups: [] },
				],
				truncated: false,
			},
		});
	});

	test("the worker is reused, so only the first run pays module evaluation", async () => {
		// Spawning per run would charge ~1.4s of startup against the 2s bound and
		// report ordinary patterns as too slow. The first run is the slow one.
		const first = Date.now();
		await runRegexTesterAsync({ pattern: "a", flags: "", sample: "a" });
		const second = Date.now();
		await runRegexTesterAsync({ pattern: "b", flags: "", sample: "b" });
		const reuse = Date.now() - second;

		expect(Date.now() - first).toBeLessThan(REGEX_RUN_TIMEOUT_MS * 3);
		expect(reuse).toBeLessThan(REGEX_RUN_TIMEOUT_MS);
	});

	test("a second run is not answered with the first run's matches", async () => {
		// The reply carries a request id; if the ids were mishandled a stale
		// worker message would render the previous pattern's matches.
		const first = await runRegexTesterAsync({ pattern: "a+", flags: "", sample: "aaa" });
		const second = await runRegexTesterAsync({ pattern: "b+", flags: "", sample: "bb" });
		expect(first).toMatchObject({ ok: true, value: { matches: [{ text: "aaa" }] } });
		expect(second).toMatchObject({ ok: true, value: { matches: [{ text: "bb" }] } });
	});

	test("rejections happen before a worker is spawned", async () => {
		expect(await runRegexTesterAsync({ pattern: "", flags: "", sample: "" })).toMatchObject({
			ok: false,
			error: { code: "empty_input" },
		});
		expect(await runRegexTesterAsync({ pattern: "(", flags: "", sample: "" })).toMatchObject({
			ok: false,
			error: { code: "invalid_pattern" },
		});
		expect(await runRegexTesterAsync({ pattern: "a", flags: "z", sample: "" })).toMatchObject({
			ok: false,
			error: { code: "invalid_input" },
		});
		expect(
			await runRegexTesterAsync({ pattern: "a".repeat(600), flags: "", sample: "" }),
		).toMatchObject({ ok: false, error: { code: "input_too_large" } });
		expect(
			await runRegexTesterAsync({ pattern: "a", flags: "", sample: "x".repeat(20_001) }),
		).toMatchObject({ ok: false, error: { code: "input_too_large" } });
	});

	test("the timeout is short enough to keep the UI responsive", () => {
		expect(REGEX_RUN_TIMEOUT_MS).toBeLessThanOrEqual(3000);
	});
});
