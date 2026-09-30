import { describe, expect, test } from "bun:test";
import { runDatetimeHelper } from "./logic";
import { parseDatetimeHelperInput } from "./schema";

describe("datetime-helper", () => {
	test("rejects a non-string value", () => {
		expect(parseDatetimeHelperInput({ value: 1 })).toMatchObject({
			ok: false,
			error: { code: "invalid_input" },
		});
	});

	test("reads the epoch in seconds and milliseconds", () => {
		const sec = runDatetimeHelper({ value: "0", mode: "timestamp" }, 0);
		const ms = runDatetimeHelper({ value: "1759190400000", mode: "timestamp" }, 0);
		expect(sec.ok && ms.ok).toBe(true);
		if (!sec.ok || !ms.ok) return;
		expect(sec.value.utc).toBe("1970-01-01T00:00:00.000Z");
		expect(sec.value.relative).toBe("in 0 seconds");
		expect(ms.value.timestampMs).toBe(1759190400000);
		expect(ms.value.timestampSec).toBe(1759190400);
	});

	test("reads ISO dates with relative words", () => {
		const result = runDatetimeHelper(
			{ value: "2026-10-03T00:00:00.000Z", mode: "iso" },
			Date.parse("2026-10-01T00:00:00.000Z"),
		);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.relative).toBe("in 2 days");
		expect(result.value.timestampSec).toBe(
			Math.floor(Date.parse("2026-10-03T00:00:00.000Z") / 1000),
		);
	});

	test("names bad input with codes", () => {
		expect(runDatetimeHelper({ value: "", mode: "timestamp" })).toMatchObject({
			ok: false,
			error: { code: "empty_input" },
		});
		expect(runDatetimeHelper({ value: "abc", mode: "timestamp" })).toMatchObject({
			ok: false,
			error: { code: "invalid_date" },
		});
		expect(runDatetimeHelper({ value: "not a date", mode: "iso" })).toMatchObject({
			ok: false,
			error: { code: "invalid_date" },
		});
	});
});
