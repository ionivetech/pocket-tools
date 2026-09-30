import { describe, expect, test } from "bun:test";
import { decodeJwt } from "./logic";
import { parseJwtDecoderInput } from "./schema";

function base64Url(object: unknown): string {
	const bytes = new TextEncoder().encode(JSON.stringify(object));
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

const HEADER = { alg: "HS256", typ: "JWT" };
const PAYLOAD = { sub: "123", name: "Test User" };

function base64UrlRaw(text: string): string {
	const bytes = new TextEncoder().encode(text);
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
const SAMPLE = `${base64Url(HEADER)}.${base64Url(PAYLOAD)}.c2lnbmF0dXJl`;

describe("jwt-decoder", () => {
	test("rejects a non-string token value", () => {
		expect(parseJwtDecoderInput({ token: 1 })).toMatchObject({
			ok: false,
			error: { code: "invalid_input" },
		});
	});

	test("decodes header, payload, algorithm and signature presence", () => {
		const result = decodeJwt(SAMPLE);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.header).toEqual(HEADER);
		expect(result.value.payload).toEqual(PAYLOAD);
		expect(result.value.algorithm).toBe("HS256");
		expect(result.value.signaturePresent).toBe(true);
	});

	test("reports an unsigned token without failing", () => {
		const unsigned = `${base64Url(HEADER)}.${base64Url(PAYLOAD)}.`;
		const result = decodeJwt(unsigned);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.signaturePresent).toBe(false);
	});

	test("rejects empty input and wrong part counts with codes", () => {
		expect(decodeJwt("")).toMatchObject({ ok: false, error: { code: "empty_input" } });
		expect(decodeJwt("only-one-part")).toMatchObject({
			ok: false,
			error: { code: "invalid_format" },
		});
		expect(decodeJwt("a.b")).toMatchObject({ ok: false, error: { code: "invalid_format" } });
	});

	test("names the broken part for bad encoding and bad JSON", () => {
		expect(decodeJwt("%%%.e30.c2ln")).toMatchObject({
			ok: false,
			error: { code: "invalid_encoding" },
		});
		expect(decodeJwt(`${base64UrlRaw("definitely not json")}.e30.c2ln`)).toMatchObject({
			ok: false,
			error: { code: "invalid_json" },
		});
	});
});
