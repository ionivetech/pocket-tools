import type { Result } from "../../types/tool";
import type { JwtDecoderInput } from "./schema";

export type JwtDecoderOutput = Readonly<{
	header: unknown;
	payload: unknown;
	algorithm: string | null;
	signaturePresent: boolean;
}>;

export type JwtDecoderErrorCode =
	| "empty_input"
	| "invalid_format"
	| "invalid_encoding"
	| "invalid_json";

function failure(code: JwtDecoderErrorCode, message: string): Result<never> {
	return { ok: false, error: { code, message } };
}

function base64UrlToBytes(segment: string): Uint8Array | null {
	if (!/^[A-Za-z0-9_-]*$/.test(segment) || segment.length % 4 === 1) {
		return null;
	}
	const base64 = segment.replaceAll("-", "+").replaceAll("_", "/");
	const padding = (4 - (base64.length % 4)) % 4;
	try {
		const binary = atob(`${base64}${"=".repeat(padding)}`);
		return Uint8Array.from(binary, (character) => character.charCodeAt(0));
	} catch {
		return null;
	}
}

const decoder = new TextDecoder("utf-8", { fatal: true });

function decodeSegment(
	segment: string,
	name: string,
): Result<unknown> | { readonly ok: true; readonly value: unknown } {
	if (segment === "") {
		return failure("invalid_encoding", `The ${name} part is empty.`);
	}
	const bytes = base64UrlToBytes(segment);
	if (bytes === null) {
		return failure("invalid_encoding", `The ${name} part is not valid base64url.`);
	}
	let text: string;
	try {
		text = decoder.decode(bytes);
	} catch {
		return failure("invalid_encoding", `The ${name} part is not valid UTF-8.`);
	}
	try {
		return { ok: true, value: JSON.parse(text) as unknown };
	} catch {
		return failure("invalid_json", `The ${name} part is not valid JSON.`);
	}
}

/**
 * Decodes a JWT into header and payload without verifying anything. The
 * signature is reported as present/absent only — this tool never validates
 * trust, and the UI must say so.
 *
 * @example
 * ```ts
 * decodeJwt("eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2ln").value.algorithm; // "HS256"
 * decodeJwt("nope").error.code; // "invalid_format"
 * ```
 */
export function decodeJwt(token: string): Result<JwtDecoderOutput> {
	if (token.trim() === "") {
		return failure("empty_input", "Paste a login token first.");
	}
	const parts = token.trim().split(".");
	if (parts.length !== 3) {
		return failure(
			"invalid_format",
			"A login token has three parts separated by dots: header, payload, signature.",
		);
	}
	const [headerSegment, payloadSegment, signatureSegment] = parts as [string, string, string];

	const header = decodeSegment(headerSegment!, "header");
	if (!header.ok) {
		return header;
	}
	const payload = decodeSegment(payloadSegment!, "payload");
	if (!payload.ok) {
		return payload;
	}

	const algorithm =
		typeof header.value === "object" &&
		header.value !== null &&
		typeof (header.value as Record<string, unknown>).alg === "string"
			? ((header.value as Record<string, unknown>).alg as string)
			: null;

	return {
		ok: true,
		value: {
			header: header.value,
			payload: payload.value,
			algorithm,
			signaturePresent: signatureSegment !== "",
		},
	};
}

/**
 * Runs the tool from validated input (empty input is an error, not silence).
 *
 * @example
 * ```ts
 * runJwtDecoder({ token: "a.e30.c" }).ok; // true
 * ```
 */
export function runJwtDecoder(input: JwtDecoderInput): Result<JwtDecoderOutput> {
	return decodeJwt(input.token);
}
