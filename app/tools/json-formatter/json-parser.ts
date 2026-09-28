/**
 * A hand-rolled JSON parser that reports the exact line and column of a
 * syntax error.
 *
 * `JSON.parse` is deliberately not used here: its error messages differ by
 * JS engine (V8 includes a character position, JavaScriptCore does not), so
 * the same invalid input would report a location in a browser and nothing
 * during `bun test`. A small recursive-descent parser keeps that behaviour
 * identical everywhere the tool runs, at the cost of one file of grammar.
 */

export type JsonParseErrorInfo = Readonly<{
	message: string;
	line: number;
	column: number;
	position: number;
}>;

export type JsonParseResult =
	| { readonly ok: true; readonly value: unknown }
	| { readonly ok: false; readonly error: JsonParseErrorInfo };

type Cursor = { index: number; line: number; column: number };

function locationError(text: string, cursor: Cursor, message: string): JsonParseErrorInfo {
	return { message, line: cursor.line, column: cursor.column, position: cursor.index };
}

function advance(text: string, cursor: Cursor): void {
	const char = text[cursor.index];
	cursor.index += 1;
	if (char === "\n") {
		cursor.line += 1;
		cursor.column = 1;
	} else {
		cursor.column += 1;
	}
}

function skipWhitespace(text: string, cursor: Cursor): void {
	while (cursor.index < text.length && /[ \t\n\r]/.test(text[cursor.index] as string)) {
		advance(text, cursor);
	}
}

type StepResult<T> = { ok: true; value: T } | { ok: false; error: JsonParseErrorInfo };

function fail<T>(text: string, cursor: Cursor, message: string): StepResult<T> {
	return { ok: false, error: locationError(text, cursor, message) };
}

function parseLiteral(
	text: string,
	cursor: Cursor,
	literal: string,
	value: unknown,
): StepResult<unknown> {
	if (text.slice(cursor.index, cursor.index + literal.length) !== literal) {
		return fail(text, cursor, `Expected "${literal}".`);
	}
	for (let count = 0; count < literal.length; count += 1) {
		advance(text, cursor);
	}
	return { ok: true, value };
}

const escapeMap: Record<string, string> = {
	'"': '"',
	"\\": "\\",
	"/": "/",
	b: "\b",
	f: "\f",
	n: "\n",
	r: "\r",
	t: "\t",
};

function parseString(text: string, cursor: Cursor): StepResult<string> {
	const start = { ...cursor };
	advance(text, cursor); // opening quote
	let result = "";

	while (true) {
		if (cursor.index >= text.length) {
			return fail(text, start, "Unterminated string.");
		}
		const char = text[cursor.index] as string;

		if (char === '"') {
			advance(text, cursor);
			return { ok: true, value: result };
		}

		if (char === "\\") {
			advance(text, cursor);
			const escapeChar = text[cursor.index];
			if (escapeChar === undefined) {
				return fail(text, start, "Unterminated escape sequence.");
			}
			if (escapeChar === "u") {
				const hex = text.slice(cursor.index + 1, cursor.index + 5);
				if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
					return fail(text, cursor, "Invalid unicode escape.");
				}
				result += String.fromCharCode(Number.parseInt(hex, 16));
				for (let count = 0; count < 5; count += 1) {
					advance(text, cursor);
				}
				continue;
			}
			const mapped = escapeMap[escapeChar];
			if (mapped === undefined) {
				return fail(text, cursor, `Invalid escape character "\\${escapeChar}".`);
			}
			result += mapped;
			advance(text, cursor);
			continue;
		}

		if (char.charCodeAt(0) < 0x20) {
			return fail(text, cursor, "Control characters must be escaped in a string.");
		}

		result += char;
		advance(text, cursor);
	}
}

function parseNumber(text: string, cursor: Cursor): StepResult<number> {
	const start = cursor.index;
	if (text[cursor.index] === "-") {
		advance(text, cursor);
	}
	if (text[cursor.index] === "0") {
		advance(text, cursor);
	} else if (/[1-9]/.test(text[cursor.index] ?? "")) {
		while (/[0-9]/.test(text[cursor.index] ?? "")) {
			advance(text, cursor);
		}
	} else {
		return fail(text, cursor, "Invalid number.");
	}
	if (text[cursor.index] === ".") {
		advance(text, cursor);
		if (!/[0-9]/.test(text[cursor.index] ?? "")) {
			return fail(text, cursor, "Expected a digit after the decimal point.");
		}
		while (/[0-9]/.test(text[cursor.index] ?? "")) {
			advance(text, cursor);
		}
	}
	if (text[cursor.index] === "e" || text[cursor.index] === "E") {
		advance(text, cursor);
		const sign = text[cursor.index];
		if (sign === "+" || sign === "-") {
			advance(text, cursor);
		}
		if (!/[0-9]/.test(text[cursor.index] ?? "")) {
			return fail(text, cursor, "Expected a digit in the exponent.");
		}
		while (/[0-9]/.test(text[cursor.index] ?? "")) {
			advance(text, cursor);
		}
	}
	return { ok: true, value: Number(text.slice(start, cursor.index)) };
}

function parseArray(text: string, cursor: Cursor): StepResult<unknown[]> {
	advance(text, cursor); // [
	const values: unknown[] = [];
	skipWhitespace(text, cursor);
	if (text[cursor.index] === "]") {
		advance(text, cursor);
		return { ok: true, value: values };
	}

	while (true) {
		skipWhitespace(text, cursor);
		const element = parseValue(text, cursor);
		if (!element.ok) {
			return element;
		}
		values.push(element.value);
		skipWhitespace(text, cursor);

		const next = text[cursor.index];
		if (next === ",") {
			advance(text, cursor);
			continue;
		}
		if (next === "]") {
			advance(text, cursor);
			return { ok: true, value: values };
		}
		return fail(text, cursor, 'Expected "," or "]".');
	}
}

function parseObject(text: string, cursor: Cursor): StepResult<Record<string, unknown>> {
	advance(text, cursor); // {
	const result: Record<string, unknown> = {};
	skipWhitespace(text, cursor);
	if (text[cursor.index] === "}") {
		advance(text, cursor);
		return { ok: true, value: result };
	}

	while (true) {
		skipWhitespace(text, cursor);
		if (text[cursor.index] !== '"') {
			return fail(text, cursor, "Object keys must be strings.");
		}
		const key = parseString(text, cursor);
		if (!key.ok) {
			return key;
		}
		skipWhitespace(text, cursor);
		if (text[cursor.index] !== ":") {
			return fail(text, cursor, 'Expected ":" after an object key.');
		}
		advance(text, cursor);
		skipWhitespace(text, cursor);
		const value = parseValue(text, cursor);
		if (!value.ok) {
			return value;
		}
		// `result[key.value] = ...` would invoke `Object.prototype`'s `__proto__` setter for a
		// `"__proto__"` key instead of creating an own property -- it never touches the shared
		// `Object.prototype` here (this only reassigns `result`'s own prototype pointer, so it
		// is not the classic cross-object pollution a recursive merge produces), but it does
		// silently rewrite this one parsed object's prototype and drop the key, unlike real
		// `JSON.parse`. `defineProperty` always creates a real own data property regardless of
		// the key's name, matching `JSON.parse`'s behavior for this exact input.
		Object.defineProperty(result, key.value, {
			value: value.value,
			writable: true,
			enumerable: true,
			configurable: true,
		});
		skipWhitespace(text, cursor);

		const next = text[cursor.index];
		if (next === ",") {
			advance(text, cursor);
			continue;
		}
		if (next === "}") {
			advance(text, cursor);
			return { ok: true, value: result };
		}
		return fail(text, cursor, 'Expected "," or "}".');
	}
}

function parseValue(text: string, cursor: Cursor): StepResult<unknown> {
	skipWhitespace(text, cursor);
	const char = text[cursor.index];

	if (char === undefined) {
		return fail(text, cursor, "Unexpected end of input.");
	}
	if (char === '"') {
		return parseString(text, cursor);
	}
	if (char === "{") {
		return parseObject(text, cursor);
	}
	if (char === "[") {
		return parseArray(text, cursor);
	}
	if (char === "t") {
		return parseLiteral(text, cursor, "true", true);
	}
	if (char === "f") {
		return parseLiteral(text, cursor, "false", false);
	}
	if (char === "n") {
		return parseLiteral(text, cursor, "null", null);
	}
	if (char === "-" || /[0-9]/.test(char)) {
		return parseNumber(text, cursor);
	}
	return fail(text, cursor, `Unexpected character "${char}".`);
}

/**
 * Parses JSON text, returning a precise line/column for the first syntax
 * error instead of a generic engine message.
 *
 * @example
 * ```ts
 * parseJsonWithLocation("{}"); // { ok: true, value: {} }
 * parseJsonWithLocation("{").ok; // false
 * ```
 */
export function parseJsonWithLocation(text: string): JsonParseResult {
	const cursor: Cursor = { index: 0, line: 1, column: 1 };

	if (text.trim() === "") {
		return { ok: false, error: locationError(text, cursor, "Input is empty.") };
	}

	const value = parseValue(text, cursor);
	if (!value.ok) {
		return value;
	}

	skipWhitespace(text, cursor);
	if (cursor.index < text.length) {
		return {
			ok: false,
			error: locationError(text, cursor, "Unexpected trailing content after the JSON value."),
		};
	}

	return { ok: true, value: value.value };
}
