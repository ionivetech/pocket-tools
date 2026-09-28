import type { Result } from "../../types/tool";
import type { Base64Direction, Base64Newline, Base64ToolInput } from "./schema";

export type Base64ToolOutput = Readonly<{
	result: string;
	direction: Exclude<Base64Direction, "auto">;
}>;

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

/** A base64 string, ignoring whitespace, must use only this alphabet plus optional padding. */
const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;

/**
 * Encodes raw bytes as base64 text. Pure and reusable for both typed text
 * and dropped files, since both ultimately reduce to a byte array.
 *
 * @example
 * ```ts
 * encodeBase64Bytes(new TextEncoder().encode("hi")); // "aGk="
 * ```
 */
export function encodeBase64Bytes(bytes: Uint8Array): string {
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary);
}

/**
 * Decodes base64 text back to raw bytes, or `undefined` for text that is
 * not valid base64.
 *
 * @example
 * ```ts
 * decodeBase64ToBytes("aGk="); // Uint8Array [104, 105]
 * decodeBase64ToBytes("not base64!!"); // undefined
 * ```
 */
export function decodeBase64ToBytes(value: string): Uint8Array | undefined {
	const compact = value.replace(/\s+/g, "");
	if (compact === "" || !base64Pattern.test(compact) || compact.length % 4 !== 0) {
		return undefined;
	}
	try {
		const binary = atob(compact);
		return Uint8Array.from(binary, (char) => char.charCodeAt(0));
	} catch {
		return undefined;
	}
}

/**
 * Converts classic base64 to base64url: `-_` alphabet, padding stripped.
 *
 * @example
 * ```ts
 * toBase64Url("aGVsbG8/"); // "aGVsbG8_"
 * ```
 */
export function toBase64Url(value: string): string {
	return value.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

/**
 * Converts base64url back to classic base64 (padding restored), or
 * `undefined` for text outside the base64url alphabet.
 *
 * @example
 * ```ts
 * fromBase64Url("aGVsbG8"); // "aGVsbG8="
 * ```
 */
export function fromBase64Url(value: string): string | undefined {
	const compact = value.replace(/\s+/g, "").replace(/=+$/, "");
	if (compact === "" || !/^[A-Za-z0-9\-_]*$/.test(compact) || compact.length % 4 === 1) {
		return undefined;
	}
	const classic = compact.replaceAll("-", "+").replaceAll("_", "/");
	return `${classic}${"=".repeat((4 - (classic.length % 4)) % 4)}`;
}

/**
 * Applies the URL-safe alphabet and column wrapping to an encoded payload.
 * Wrapping only makes sense for base64 output, never for decoded text.
 *
 * @example
 * ```ts
 * formatBase64Encoded("aGVsbG8gd29ybGQ=", { urlSafe: false, wrapAt: 4, newline: "lf" }); // "aGVs\nbG8g\nd29y\nbGQ="
 * ```
 */
export function formatBase64Encoded(
	raw: string,
	options: Readonly<{ urlSafe?: boolean; wrapAt?: number; newline?: Base64Newline }>,
): string {
	const alphabet = options.urlSafe === true ? toBase64Url(raw) : raw;
	const width = options.wrapAt ?? 0;
	if (width <= 0 || alphabet.length <= width) {
		return alphabet;
	}
	const newline = options.newline === "crlf" ? "\r\n" : "\n";
	const chunks: string[] = [];
	for (let index = 0; index < alphabet.length; index += width) {
		chunks.push(alphabet.slice(index, index + width));
	}
	return chunks.join(newline);
}

/**
 * A conservative heuristic for "does this look like base64 someone wants
 * decoded", used only to pick a sensible default direction. It never
 * replaces the user's own choice, and it is deliberately stricter than
 * `decodeBase64ToBytes` about length, so short incidental strings such as
 * `"abcd"` are not auto-decoded into an unreadable byte dump.
 *
 * @example
 * ```ts
 * looksLikeBase64("aGVsbG8gd29ybGQ="); // true
 * looksLikeBase64("hello world"); // false
 * ```
 */
export function looksLikeBase64(text: string): boolean {
	const compact = text.trim().replace(/\s+/g, "");
	return compact.length >= 8 && decodeBase64ToBytes(compact) !== undefined;
}

/**
 * URL-safe counterpart to {@link looksLikeBase64}: true for decodable
 * base64url payloads of a plausible length.
 *
 * @example
 * ```ts
 * looksLikeBase64Url("aGVsbG8td29ybGQ"); // true
 * ```
 */
export function looksLikeBase64Url(text: string): boolean {
	const trimmed = text.trim();
	// Base64url travels in single tokens (URLs, JWT parts): anything with
	// whitespace is plain text or wrapped classic, never a url payload.
	if (trimmed === "" || /\s/.test(trimmed)) {
		return false;
	}
	const compact = trimmed;
	if (compact.length < 8 || /[+/=]/.test(compact)) {
		return false;
	}
	const classic = fromBase64Url(compact);
	return classic !== undefined && decodeBase64ToBytes(classic) !== undefined;
}

/**
 * Encodes or decodes text as base64. `"auto"` picks a direction with
 * {@link looksLikeBase64} (classic) or {@link looksLikeBase64Url} (when the
 * URL-safe option is on) and reports which one it chose. Wrapping and the
 * URL-safe alphabet apply to encoded output only.
 *
 * @example
 * ```ts
 * runBase64Tool({ text: "hello", direction: "encode" }); // { ok: true, value: { result: "aGVsbG8=", direction: "encode" } }
 * ```
 */
export function runBase64Tool(input: Base64ToolInput): Result<Base64ToolOutput> {
	if (input.text === "") {
		return { ok: false, error: { code: "empty_input", message: "Paste or type some text first." } };
	}

	const urlSafe = input.urlSafe === true;
	const direction: Exclude<Base64Direction, "auto"> =
		input.direction === "auto"
			? looksLikeBase64(input.text) || (urlSafe && looksLikeBase64Url(input.text))
				? "decode"
				: "encode"
			: input.direction;

	if (direction === "encode") {
		const raw = encodeBase64Bytes(encoder.encode(input.text));
		return {
			ok: true,
			value: {
				result: formatBase64Encoded(raw, {
					urlSafe,
					wrapAt: input.wrapAt,
					newline: input.newline,
				}),
				direction,
			},
		};
	}

	const candidate = urlSafe ? fromBase64Url(input.text) : input.text;
	const bytes = candidate === undefined ? undefined : decodeBase64ToBytes(candidate);
	if (bytes === undefined) {
		return {
			ok: false,
			error: { code: "invalid_base64", message: "That is not valid base64 text." },
		};
	}

	try {
		return { ok: true, value: { result: decoder.decode(bytes), direction } };
	} catch {
		return {
			ok: false,
			error: {
				code: "not_utf8_text",
				message: "That base64 decodes to bytes that are not readable text (likely a binary file).",
			},
		};
	}
}
