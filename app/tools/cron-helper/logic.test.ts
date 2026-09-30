import { describe, expect, test } from "bun:test";
import { runCronHelper } from "./logic";
import { parseCronHelperInput } from "./schema";

// Wednesday 2026-09-30, 08:00 local time.
const NOW = new Date(2026, 8, 30, 8, 0, 0);

describe("cron-helper", () => {
	test("rejects a non-string expression value", () => {
		expect(parseCronHelperInput({ expression: 1 })).toMatchObject({
			ok: false,
			error: { code: "invalid_input" },
		});
	});

	test("describes weekdays at 09:30 with the next run today", () => {
		const result = runCronHelper({ expression: "30 9 * * 1-5" }, NOW);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.description).toBe("At 09:30, every weekday.");
		expect(result.value.nextRuns).toHaveLength(3);
		expect(result.value.nextRuns[0]).toContain("09:30");
	});

	test("describes every minute and midnight daily", () => {
		const everyMinute = runCronHelper({ expression: "* * * * *" }, NOW);
		const midnight = runCronHelper({ expression: "0 0 * * *" }, NOW);
		expect(everyMinute.ok && midnight.ok).toBe(true);
		if (!everyMinute.ok || !midnight.ok) return;
		expect(everyMinute.value.description).toContain("Every minute");
		expect(midnight.value.description).toBe("At 00:00, every day.");
	});

	test("supports steps, ranges and lists", () => {
		expect(runCronHelper({ expression: "*/15 * * * *" }, NOW).ok).toBe(true);
		expect(runCronHelper({ expression: "0 9 1,15 * *" }, NOW).ok).toBe(true);
		const sunday = runCronHelper({ expression: "0 0 * * 0" }, NOW);
		expect(sunday.ok).toBe(true);
		if (!sunday.ok) return;
		expect(sunday.value.description).toContain("Sunday");
	});

	test("names bad shapes and ranges with codes", () => {
		expect(runCronHelper({ expression: "" }, NOW)).toMatchObject({
			ok: false,
			error: { code: "empty_input" },
		});
		expect(runCronHelper({ expression: "* * *" }, NOW)).toMatchObject({
			ok: false,
			error: { code: "invalid_format" },
		});
		expect(runCronHelper({ expression: "99 * * * *" }, NOW)).toMatchObject({
			ok: false,
			error: { code: "out_of_range" },
		});
	});
});
