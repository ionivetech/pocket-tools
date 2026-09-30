import type { Result } from "../../types/tool";
import { parseCronHelperInput, type CronHelperInput } from "./schema";

export type CronField = "minute" | "hour" | "day of month" | "month" | "day of week";

export type CronHelperOutput = Readonly<{
	expression: string;
	description: string;
	nextRuns: readonly string[];
	timezone: string;
}>;

export type CronHelperErrorCode = "empty_input" | "invalid_format" | "out_of_range";

const FIELD_RANGES: Readonly<Record<CronField, readonly [number, number]>> = {
	minute: [0, 59],
	hour: [0, 23],
	"day of month": [1, 31],
	month: [1, 12],
	"day of week": [0, 7],
};

const FIELD_ORDER: readonly CronField[] = [
	"minute",
	"hour",
	"day of month",
	"month",
	"day of week",
];

function failure(code: CronHelperErrorCode, message: string): Result<never> {
	return { ok: false, error: { code, message } };
}

function parseToken(token: string, min: number, max: number, field: CronField): Set<number> | null {
	const values = new Set<number>();
	const addRange = (from: number, to: number, step: number): boolean => {
		if (
			!Number.isInteger(from) ||
			!Number.isInteger(to) ||
			!Number.isInteger(step) ||
			step < 1 ||
			from < min ||
			to > max ||
			from > to
		) {
			return false;
		}
		for (let value = from; value <= to; value += step) {
			values.add(value);
		}
		return true;
	};

	const [rangePart = "", stepPart = "1"] = token.split("/");
	const step = stepPart === "" ? Number.NaN : Number(stepPart);
	if (rangePart === "*") {
		return addRange(min, max, step) ? values : null;
	}
	for (const item of rangePart.split(",")) {
		if (item.includes("-")) {
			const [fromText = "", toText = ""] = item.split("-");
			if (!addRange(Number(fromText), Number(toText), step)) {
				return null;
			}
		} else {
			const value = Number(item);
			if (!addRange(value, value, step)) {
				return null;
			}
		}
	}
	if (values.size === 0) {
		return null;
	}
	// Sunday is both 0 and 7 in day of week.
	if (field === "day of week" && values.has(7)) {
		values.add(0);
	}
	return values;
}

type ParsedCron = Readonly<Record<CronField, Set<number>>>;

function parseExpression(expression: string): Result<ParsedCron> | { ok: true; value: ParsedCron } {
	const fields = expression.trim().split(/\s+/);
	if (fields.length !== 5) {
		return failure(
			"invalid_format",
			"A schedule has five parts: minute, hour, day of month, month, day of week.",
		);
	}
	const parsed = {} as Record<CronField, Set<number>>;
	for (let index = 0; index < FIELD_ORDER.length; index += 1) {
		const field = FIELD_ORDER[index]!;
		const [min, max] = FIELD_RANGES[field]!;
		const values = parseToken(fields[index] ?? "", min!, max!, field);
		if (!values) {
			return failure(
				"out_of_range",
				`"${fields[index] ?? ""}" is not valid for ${field} (${min}–${max}).`,
			);
		}
		parsed[field] = values;
	}
	return { ok: true, value: parsed };
}

function matchesDate(date: Date, parsed: ParsedCron): boolean {
	// Sunday 7 is normalized to 0 at parse time, so getDay() compares directly.
	const domRestricted = parsed["day of month"].size < 31;
	const dowRestricted = parsed["day of week"].size < 8;
	const domMatch = parsed["day of month"].has(date.getDate());
	const dowMatch = parsed["day of week"].has(date.getDay());
	const dayOk = domRestricted && dowRestricted ? domMatch || dowMatch : domMatch && dowMatch;
	return (
		parsed.minute.has(date.getMinutes()) &&
		parsed.hour.has(date.getHours()) &&
		parsed.month.has(date.getMonth() + 1) &&
		dayOk
	);
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

function listText(values: Set<number>, names: readonly string[]): string {
	const sorted = [...values].sort((a, b) => a - b);
	if (sorted.length === 1) {
		return names[sorted[0]!] ?? String(sorted[0]);
	}
	return sorted.map((value) => names[value] ?? String(value)).join(", ");
}

function describeTime(minutes: Set<number>, hours: Set<number>): string {
	if (minutes.size === 60 && hours.size === 24) {
		return "Every minute";
	}
	if (minutes.size === 1 && hours.size === 24) {
		return `At minute ${[...minutes][0]} of every hour`;
	}
	if (minutes.size === 1 && hours.size === 1) {
		const hour = [...hours][0]!;
		const minute = [...minutes][0]!;
		return `At ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
	}
	return "At the selected minutes and hours";
}

function describe(parsed: ParsedCron): string {
	const time = describeTime(parsed.minute, parsed.hour);
	const domRestricted = parsed["day of month"].size < 31;
	const dowDays = new Set(parsed["day of week"]);
	dowDays.delete(7);
	const dowRestricted = dowDays.size < 7;
	const monthRestricted = parsed.month.size < 12;

	let day = "every day";
	if (!domRestricted && dowRestricted) {
		const days = [...dowDays].sort((a, b) => a - b);
		const isWeekdays = days.length === 5 && days.every((day) => day >= 1 && day <= 5);
		day = isWeekdays ? "every weekday" : `on ${listText(dowDays, WEEKDAYS)}`;
	} else if (domRestricted && !dowRestricted) {
		day = `on day ${[...parsed["day of month"]].sort((a, b) => a - b).join(", ")} of the month`;
	} else if (domRestricted && dowRestricted) {
		day = "on matching month-days or week-days";
	}
	const month = monthRestricted ? ` in ${listText(parsed.month, ["", ...MONTHS])}` : "";
	return `${time}, ${day}${month}.`;
}

const SEARCH_LIMIT_MINUTES = 366 * 24 * 60;

function nextRuns(parsed: ParsedCron, from: Date, count: number): Date[] {
	const runs: Date[] = [];
	const cursor = new Date(from.getTime());
	cursor.setSeconds(0, 0);
	cursor.setMinutes(cursor.getMinutes() + 1);
	for (let step = 0; step < SEARCH_LIMIT_MINUTES && runs.length < count; step += 1) {
		if (matchesDate(cursor, parsed)) {
			runs.push(new Date(cursor.getTime()));
		}
		cursor.setMinutes(cursor.getMinutes() + 1);
	}
	return runs;
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
	weekday: "short",
	day: "2-digit",
	month: "short",
	hour: "2-digit",
	minute: "2-digit",
});

/**
 * Parses a 5-part schedule, describes it in plain words, and lists the next
 * three local runs. Seconds, years and time-zone databases are out of scope:
 * this covers the standard shape only.
 *
 * @example
 * ```ts
 * runCronHelper({ expression: "30 9 * * 1-5" }).value.description;
 * // "At 09:30, every weekday."
 * runCronHelper({ expression: "nope" }).error.code; // "invalid_format"
 * ```
 */
export function runCronHelper(
	input: CronHelperInput,
	now: Date = new Date(),
): Result<CronHelperOutput> {
	const validated = parseCronHelperInput(input);
	if (!validated.ok) {
		return validated;
	}
	const expression = validated.value.expression.trim();
	if (expression === "") {
		return failure("empty_input", "Type a schedule first, like 30 9 * * 1-5.");
	}
	const parsed = parseExpression(expression);
	if (!parsed.ok) {
		return parsed;
	}
	const runs = nextRuns(parsed.value, now, 3);
	const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "local time";
	return {
		ok: true,
		value: {
			expression: expression.replace(/\s+/g, " "),
			description: describe(parsed.value),
			nextRuns: runs.map((run) => dateFormatter.format(run)),
			timezone,
		},
	};
}
