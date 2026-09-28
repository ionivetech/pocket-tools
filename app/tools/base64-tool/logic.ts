import type { Result } from "../../types/tool";
import type { Base64Direction, Base64ToolInput } from "./schema";

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
 * Encodes or decodes text as base64. `"auto"` picks a direction with
 * {@link looksLikeBase64} and reports which one it chose.
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

	const direction: Exclude<Base64Direction, "auto"> =
		input.direction === "auto"
			? looksLikeBase64(input.text)
				? "decode"
				: "encode"
			: input.direction;

	if (direction === "encode") {
		return {
			ok: true,
			value: { result: encodeBase64Bytes(encoder.encode(input.text)), direction },
		};
	}

	const bytes = decodeBase64ToBytes(input.text);
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
