import type { Result } from "../../types/tool";
import { DATETIME_MODES, parseDatetimeHelperInput, type DatetimeHelperInput } from "./schema";

export { DATETIME_MODES };

export type DatetimeHelperOutput = Readonly<{
	timestampMs: number;
	timestampSec: number;
	local: string;
	utc: string;
	relative: string;
	timezone: string;
}>;

export type DatetimeHelperErrorCode = "empty_input" | "invalid_date";

const localFormatter = new Intl.DateTimeFormat("en-GB", {
	weekday: "long",
	day: "2-digit",
	month: "long",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
});

function relativeLabel(target: number, now: number): string {
	const diffSeconds = Math.round((target - now) / 1000);
	const future = diffSeconds >= 0;
	const abs = Math.abs(diffSeconds);
	let count: number;
	let unit: string;
	if (abs < 60) {
		count = abs;
		unit = "second";
	} else if (abs < 3600) {
		count = Math.round(abs / 60);
		unit = "minute";
	} else if (abs < 86_400) {
		count = Math.round(abs / 3600);
		unit = "hour";
	} else if (abs < 2_592_000) {
		count = Math.round(abs / 86_400);
		unit = "day";
	} else if (abs < 31_104_000) {
		count = Math.round(abs / 2_592_000);
		unit = "month";
	} else {
		count = Math.round(abs / 31_104_000);
		unit = "year";
	}
	const plural = count === 1 ? "" : "s";
	return future ? `in ${count} ${unit}${plural}` : `${count} ${unit}${plural} ago`;
}

/**
 * Converts timestamps (seconds or milliseconds, auto-detected) and ISO dates
 * into local time, UTC and plain relative words, with the zone labeled.
 *
 * @example
 * ```ts
 * runDatetimeHelper({ value: "0", mode: "timestamp" }, 0).value.utc;
 * // "1970-01-01T00:00:00.000Z"
 * ```
 */
export function runDatetimeHelper(
	input: DatetimeHelperInput,
	now: number = Date.now(),
): Result<DatetimeHelperOutput> {
	const validated = parseDatetimeHelperInput(input);
	if (!validated.ok) {
		return validated;
	}
	const text = validated.value.value.trim();
	if (text === "") {
		return {
			ok: false,
			error: { code: "empty_input", message: "Type a timestamp or a date first." },
		};
	}

	let timestampMs: number;
	if (validated.value.mode === "timestamp") {
		const numeric = Number(text);
		if (!Number.isFinite(numeric)) {
			return {
				ok: false,
				error: {
					code: "invalid_date",
					message: "That is not a number. Timestamps are digits only.",
				},
			};
		}
		timestampMs = Math.abs(numeric) >= 1e11 ? Math.trunc(numeric) : Math.trunc(numeric) * 1000;
	} else {
		const parsed = Date.parse(text);
		if (Number.isNaN(parsed)) {
			return {
				ok: false,
				error: {
					code: "invalid_date",
					message: "That date did not parse. Try 2026-09-30 or a full ISO string.",
				},
			};
		}
		timestampMs = parsed;
	}

	const date = new Date(timestampMs);
	const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "local time";
	return {
		ok: true,
		value: {
			timestampMs,
			timestampSec: Math.floor(timestampMs / 1000),
			local: localFormatter.format(date),
			utc: date.toISOString(),
			relative: relativeLabel(timestampMs, now),
			timezone,
		},
	};
}
