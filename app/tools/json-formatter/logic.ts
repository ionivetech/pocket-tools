import { parseJsonWithLocation } from "./json-parser";
import type { JsonFormatterInput } from "./schema";

export type JsonFormatterOutput = Readonly<{
	result: string;
	mode: JsonFormatterInput["mode"];
}>;

export type JsonStats = Readonly<{
	lines: number;
	bytes: number;
	keys: number;
	depth: number;
}>;

export type JsonFormatterErrorCode = "empty_input" | "invalid_json" | "unformattable_value";

export type JsonFormatterError = Readonly<{
	code: JsonFormatterErrorCode;
	message: string;
	line?: number;
	column?: number;
}>;

/**
 * A `Result` local to this tool: the shared `Result<T>` fixes its error
 * shape to `{ code, message }`, but this tool's line/column errors need two
 * more optional fields, so it defines its own instead of widening the
 * shared contract for one caller.
 */
export type JsonResult<T> =
	| { readonly ok: true; readonly value: T }
	| { readonly ok: false; readonly error: JsonFormatterError };

function toIndentArg(indent: JsonFormatterInput["indent"]): string | number {
	return indent === "tab" ? "\t" : indent;
}

function setOwnKey(target: Record<string, unknown>, key: string, value: unknown): void {
	// Assigning `target["__proto__"]` would set the prototype instead of an own
	// property, so that one key goes through defineProperty (same lesson as the
	// parser's prototype-hijack fix).
	if (key === "__proto__") {
		Object.defineProperty(target, key, {
			value,
			enumerable: true,
			configurable: true,
			writable: true,
		});
		return;
	}
	target[key] = value;
}

/**
 * Recursively sorts object keys alphabetically, leaving array order untouched.
 * Safe for hostile keys such as `"__proto__"`.
 *
 * @example
 * ```ts
 * sortJsonKeys({ b: 1, a: { d: 1, c: 2 } }); // { a: { c: 2, d: 1 }, b: 1 }
 * ```
 */
export function sortJsonKeys(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(sortJsonKeys);
	}
	if (typeof value === "object" && value !== null) {
		const sorted: Record<string, unknown> = {};
		for (const key of Object.keys(value).sort()) {
			setOwnKey(sorted, key, sortJsonKeys((value as Record<string, unknown>)[key]));
		}
		return sorted;
	}
	return value;
}

function countKeys(value: unknown): number {
	if (Array.isArray(value)) {
		return value.reduce<number>((total, item) => total + countKeys(item), 0);
	}
	if (typeof value === "object" && value !== null) {
		return Object.keys(value).reduce<number>(
			(total, key) => total + 1 + countKeys((value as Record<string, unknown>)[key]),
			0,
		);
	}
	return 0;
}

function maxDepth(value: unknown): number {
	if (Array.isArray(value)) {
		return value.reduce<number>((deepest, item) => Math.max(deepest, maxDepth(item)), 0) + 1;
	}
	if (typeof value === "object" && value !== null) {
		return (
			Object.keys(value).reduce<number>(
				(deepest, key) => Math.max(deepest, maxDepth((value as Record<string, unknown>)[key])),
				0,
			) + 1
		);
	}
	return 0;
}

const utf8 = new TextEncoder();

/**
 * Reports input size plus the parsed value's key count and nesting depth, so
 * the UI can show a stats bar without re-parsing.
 *
 * @example
 * ```ts
 * getJsonStats('{"a":{"b":1}}'); // { ok: true, value: { lines: 1, bytes: 13, keys: 2, depth: 2 } }
 * ```
 */
export function getJsonStats(text: string): JsonResult<JsonStats> {
	const validated = validateJson(text);
	if (!validated.ok) {
		return validated;
	}

	return {
		ok: true,
		value: {
			lines: text === "" ? 0 : text.split("\n").length,
			bytes: utf8.encode(text).length,
			keys: countKeys(validated.value),
			depth: maxDepth(validated.value),
		},
	};
}

/**
 * Validates JSON text and reports the exact line/column of the first syntax
 * error, so the UI can point at the problem instead of a generic message.
 *
 * @example
 * ```ts
 * validateJson('{"a":1}'); // { ok: true, value: { a: 1 } }
 * validateJson("{").ok; // false
 * ```
 */
export function validateJson(text: string): JsonResult<unknown> {
	if (text.trim() === "") {
		return { ok: false, error: { code: "empty_input", message: "Paste or type some JSON first." } };
	}

	const parsed = parseJsonWithLocation(text);
	if (!parsed.ok) {
		return {
			ok: false,
			error: {
				code: "invalid_json",
				message: parsed.error.message,
				line: parsed.error.line,
				column: parsed.error.column,
			},
		};
	}

	return { ok: true, value: parsed.value };
}

/**
 * Formats or minifies JSON text, returning specific line/column errors on
 * invalid input instead of throwing.
 *
 * @example
 * ```ts
 * runJsonFormatter({ text: '{"a":1}', indent: 2, mode: "format" });
 * ```
 */
export function runJsonFormatter(input: JsonFormatterInput): JsonResult<JsonFormatterOutput> {
	const validated = validateJson(input.text);
	if (!validated.ok) {
		return validated;
	}

	// `validated.value` comes from the tool's own parser, so it is always plain
	// JSON data and `JSON.stringify` cannot fail on it: no defensive branch.
	const value = input.sortKeys === true ? sortJsonKeys(validated.value) : validated.value;
	const result =
		input.mode === "minify"
			? JSON.stringify(value)
			: JSON.stringify(value, null, toIndentArg(input.indent));

	return { ok: true, value: { result, mode: input.mode } };
}
