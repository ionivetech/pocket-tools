import { describe, expect, test } from "bun:test";
import {
	decodeBase64ToBytes,
	encodeBase64Bytes,
	formatBase64Encoded,
	fromBase64Url,
	looksLikeBase64,
	looksLikeBase64Url,
	runBase64Tool,
	toBase64Url,
} from "./logic";
import { isBase64Direction, parseBase64ToolInput } from "./schema";

describe("base64-tool schema", () => {
	test.each(["encode", "decode", "auto"])("accepts direction %p", (direction) => {
		expect(isBase64Direction(direction)).toBe(true);
	});

	test("rejects an unsupported direction", () => {
		expect(isBase64Direction("both")).toBe(false);
	});

	test("rejects a non-string text value", () => {
		expect(parseBase64ToolInput({ text: 1, direction: "encode" })).toMatchObject({
			ok: false,
			error: { code: "invalid_input" },
		});
	});
});

describe("encodeBase64Bytes / decodeBase64ToBytes", () => {
	test("round-trips arbitrary bytes", () => {
		const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255]);
		expect(decodeBase64ToBytes(encodeBase64Bytes(bytes))).toEqual(bytes);
	});

	test("rejects text outside the base64 alphabet", () => {
		expect(decodeBase64ToBytes("not base64!!")).toBeUndefined();
	});

	test("rejects a length that is not a multiple of four", () => {
		expect(decodeBase64ToBytes("abcde")).toBeUndefined();
	});

	test("ignores embedded whitespace", () => {
		expect(decodeBase64ToBytes("aGVs\nbG8=")).toEqual(new TextEncoder().encode("hello"));
	});
});

describe("looksLikeBase64", () => {
	test("recognizes a real base64 payload", () => {
		expect(looksLikeBase64("aGVsbG8gd29ybGQ=")).toBe(true);
	});

	test("rejects plain English text", () => {
		expect(looksLikeBase64("hello world")).toBe(false);
	});

	test("rejects a short string even if technically valid base64", () => {
		expect(looksLikeBase64("YWI=")).toBe(false);
	});
});

describe("runBase64Tool", () => {
	test("encodes text", () => {
		expect(runBase64Tool({ text: "hello", direction: "encode" })).toEqual({
			ok: true,
			value: { result: "aGVsbG8=", direction: "encode" },
		});
	});

	test("decodes text", () => {
		expect(runBase64Tool({ text: "aGVsbG8=", direction: "decode" })).toEqual({
			ok: true,
			value: { result: "hello", direction: "decode" },
		});
	});

	test("round-trips unicode text through encode then decode", () => {
		const encoded = runBase64Tool({ text: "héllo 👋", direction: "encode" });
		expect(encoded.ok).toBe(true);
		if (encoded.ok) {
			expect(runBase64Tool({ text: encoded.value.result, direction: "decode" })).toEqual({
				ok: true,
				value: { result: "héllo 👋", direction: "decode" },
			});
		}
	});

	test("auto-detects a base64 payload as decode", () => {
		expect(runBase64Tool({ text: "aGVsbG8gd29ybGQ=", direction: "auto" })).toEqual({
			ok: true,
			value: { result: "hello world", direction: "decode" },
		});
	});

	test("auto-detects plain text as encode", () => {
		const result = runBase64Tool({ text: "hello world", direction: "auto" });
		expect(result).toMatchObject({ ok: true, value: { direction: "encode" } });
	});

	test("rejects empty input", () => {
		expect(runBase64Tool({ text: "", direction: "encode" })).toMatchObject({
			ok: false,
			error: { code: "empty_input" },
		});
	});

	test("rejects invalid base64 on decode", () => {
		expect(runBase64Tool({ text: "not base64!!", direction: "decode" })).toMatchObject({
			ok: false,
			error: { code: "invalid_base64" },
		});
	});

	test("reports non-UTF8 bytes as not_utf8_text", () => {
		// 0xff 0xfe is not valid UTF-8 on its own.
		const invalidUtf8 = encodeBase64Bytes(new Uint8Array([0xff, 0xfe]));
		expect(runBase64Tool({ text: invalidUtf8, direction: "decode" })).toMatchObject({
			ok: false,
			error: { code: "not_utf8_text" },
		});
	});

	test("encodes URL-safe without padding", () => {
		expect(runBase64Tool({ text: "hello?", direction: "encode", urlSafe: true })).toMatchObject({
			ok: true,
			value: { result: "aGVsbG8_", direction: "encode" },
		});
	});

	test("decodes URL-safe input with or without padding", () => {
		expect(runBase64Tool({ text: "aGVsbG8_", direction: "decode", urlSafe: true })).toEqual({
			ok: true,
			value: { result: "hello?", direction: "decode" },
		});
		expect(
			runBase64Tool({ text: "aGVsbG8gd29ybGQ=", direction: "decode", urlSafe: true }),
		).toMatchObject({ ok: true, value: { result: "hello world" } });
	});

	test("auto-detects a URL-safe payload when the option is on", () => {
		expect(
			runBase64Tool({ text: "aGVsbG8td29ybGQ", direction: "auto", urlSafe: true }),
		).toMatchObject({ ok: true, value: { result: "hello-world", direction: "decode" } });
	});

	test("wraps encoded output at the requested column", () => {
		expect(
			formatBase64Encoded("aGVsbG8gd29ybGQ=", { urlSafe: false, wrapAt: 4, newline: "lf" }),
		).toBe("aGVs\nbG8g\nd29y\nbGQ=");
	});

	test("wraps long tool output at 64 columns", () => {
		const result = runBase64Tool({ text: "a".repeat(50), direction: "encode", wrapAt: 64 });
		expect(result.ok).toBe(true);
		if (result.ok) {
			const lines = result.value.result.split("\n");
			expect(lines.map((line) => line.length)).toEqual([64, 4]);
		}
	});

	test("wraps with CRLF when requested", () => {
		const result = runBase64Tool({
			text: "a".repeat(50),
			direction: "encode",
			wrapAt: 64,
			newline: "crlf",
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.result.split("\r\n").map((line) => line.length)).toEqual([64, 4]);
		}
	});

	test("leaves decoded text unwrapped", () => {
		expect(
			runBase64Tool({ text: "aGVsbG8gd29ybGQ=", direction: "decode", wrapAt: 64 }),
		).toMatchObject({ ok: true, value: { result: "hello world" } });
	});
});

describe("base64url helpers", () => {
	test("converts between alphabets", () => {
		expect(toBase64Url("aGVsbG8/+==")).toBe("aGVsbG8_-");
		expect(fromBase64Url("aGVsbG8")).toBe("aGVsbG8=");
		expect(fromBase64Url("aGVsbG8=")).toBe("aGVsbG8=");
		expect(fromBase64Url("not base64!!")).toBeUndefined();
		expect(fromBase64Url("abcde")).toBeUndefined();
	});

	test("detects URL-safe payloads", () => {
		expect(looksLikeBase64Url("aGVsbG8td29ybGQ")).toBe(true);
		expect(looksLikeBase64Url("hello world")).toBe(false);
	});

	test("formats without touching short payloads", () => {
		expect(formatBase64Encoded("aGk=", { urlSafe: false, wrapAt: 64 })).toBe("aGk=");
	});
});
