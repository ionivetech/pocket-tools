import { parseJsonWithLocation } from "./json-parser";
import type { JsonFormatterInput } from "./schema";

export type JsonFormatterOutput = Readonly<{
	result: string;
	mode: JsonFormatterInput["mode"];
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

	try {
		const result =
			input.mode === "minify"
				? JSON.stringify(validated.value)
				: JSON.stringify(validated.value, null, toIndentArg(input.indent));

		if (typeof result !== "string") {
			return {
				ok: false,
				error: { code: "unformattable_value", message: "That JSON value cannot be serialized." },
			};
		}

		return { ok: true, value: { result, mode: input.mode } };
	} catch {
		return {
			ok: false,
			error: { code: "unformattable_value", message: "That JSON value cannot be serialized." },
		};
	}
}
