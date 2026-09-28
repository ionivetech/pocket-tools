import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	URL_STATE_MAX_BYTES,
	decodeUrlState,
	encodeUrlState,
	type UrlState,
	type UrlStateResult,
} from "../../app/utils/url-state";

type ExpectedErrorCode = "url_state_invalid" | "url_state_too_large" | "url_state_decode_failed";

const asUrlState = (value: unknown): UrlState => value as UrlState;

const expectFailure = (result: UrlStateResult<unknown>, code: ExpectedErrorCode): void => {
	if (result.ok) {
		throw new Error(`Expected ${code}`);
	}

	expect(result.error.code).toBe(code);
	expect(result.error.message.length).toBeGreaterThan(0);
	expect("value" in result).toBe(false);
};

describe("URL-state codec", () => {
	test("treats absent and empty state as an empty object", () => {
		const empty = { ok: true, value: {} };

		expect(encodeUrlState()).toEqual({ ok: true, value: "v1.e30" });
		expect(encodeUrlState({})).toEqual({ ok: true, value: "v1.e30" });
		expect(decodeUrlState(null)).toEqual(empty);
		expect(decodeUrlState(undefined)).toEqual(empty);
		expect(decodeUrlState("")).toEqual(empty);
		expect(decodeUrlState("v1.e30")).toEqual(empty);
	});

	test("round-trips only flat primitive values", () => {
		const state: UrlState = {
			text: "hello",
			count: -12.5,
			enabled: false,
			empty: null,
		};

		const encoded = encodeUrlState(state);

		expect(encoded.ok).toBe(true);
		if (!encoded.ok) {
			throw new Error("Expected primitive state to encode");
		}
		expect(decodeUrlState(encoded.value)).toEqual({ ok: true, value: state });
	});

	test("round-trips UTF-8 text", () => {
		const state: UrlState = {
			greeting: "héllo 👋 世界",
			combining: "e\u0301",
		};

		const encoded = encodeUrlState(state);

		expect(encoded.ok).toBe(true);
		if (!encoded.ok) {
			throw new Error("Expected UTF-8 state to encode");
		}
		expect(decodeUrlState(encoded.value)).toEqual({ ok: true, value: state });
	});

	test("orders equivalent state keys deterministically", () => {
		const first = encodeUrlState({ zebra: true, alpha: 1, middle: "x" });
		const second = encodeUrlState({ middle: "x", zebra: true, alpha: 1 });

		expect(first).toEqual({
			ok: true,
			value: "v1.eyJhbHBoYSI6MSwibWlkZGxlIjoieCIsInplYnJhIjp0cnVlfQ",
		});
		expect(second).toEqual(first);
	});

	test.each(["v2.e30", "1.e30", "v1e30", "V1.e30"])("rejects an invalid prefix: %s", (value) => {
		expectFailure(decodeUrlState(value), "url_state_decode_failed");
	});

	test.each(["v1.", "v1.A", "v1.@@@", "v1.eyJ9=", "v1._w"])(
		"rejects malformed base64url: %s",
		(value) => {
			expectFailure(decodeUrlState(value), "url_state_decode_failed");
		},
	);

	test("rejects invalid JSON", () => {
		expectFailure(decodeUrlState("v1.bm90LWpzb24"), "url_state_decode_failed");
	});

	test.each(["v1.Ingi", "v1.bnVsbA", "v1.WyJ4Il0", "v1.eyJiYWQiOnsiaCI6MX0"])(
		"rejects a decoded state with the wrong shape: %s",
		(value) => {
			expectFailure(decodeUrlState(value), "url_state_decode_failed");
		},
	);

	test("rejects encoded and supplied values outside the primitive allowlist", () => {
		const invalidValues: unknown[] = [
			{ nested: true },
			[1],
			undefined,
			Number.NaN,
			Number.POSITIVE_INFINITY,
			Number.NEGATIVE_INFINITY,
			1n,
			Symbol("value"),
			() => undefined,
		];

		for (const value of invalidValues) {
			expectFailure(encodeUrlState(asUrlState({ value })), "url_state_invalid");
		}

		for (const value of [null, [], new Date(0)]) {
			expectFailure(encodeUrlState(asUrlState(value)), "url_state_invalid");
		}
	});

	test("uses an inclusive 4096-byte boundary without truncation", () => {
		expect(URL_STATE_MAX_BYTES).toBe(4096);

		const largest = encodeUrlState({ x: "a".repeat(3061) });
		expect(largest.ok).toBe(true);
		if (!largest.ok) {
			throw new Error("Expected the largest representable state to encode");
		}
		expect(new TextEncoder().encode(largest.value).byteLength).toBe(4095);
		expect(decodeUrlState(largest.value)).toEqual({
			ok: true,
			value: { x: "a".repeat(3061) },
		});

		const exactBoundaryInput = `v1.${"A".repeat(4093)}`;
		const oversizedInput = `${exactBoundaryInput}A`;
		expect(new TextEncoder().encode(exactBoundaryInput).byteLength).toBe(URL_STATE_MAX_BYTES);
		expect(new TextEncoder().encode(oversizedInput).byteLength).toBe(URL_STATE_MAX_BYTES + 1);
		expectFailure(decodeUrlState(exactBoundaryInput), "url_state_decode_failed");
		expectFailure(decodeUrlState(oversizedInput), "url_state_too_large");

		const oversized = encodeUrlState({ x: "a".repeat(3062) });
		expectFailure(oversized, "url_state_too_large");
		expect("value" in oversized).toBe(false);
	});

	test("has no browser, storage, network, logging, or Buffer access", () => {
		const source = readFileSync(join(import.meta.dir, "../../app/utils/url-state.ts"), "utf8");
		const forbiddenAccess =
			/\b(?:window|document|location|history|localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|console|Buffer)\b/;

		expect(forbiddenAccess.test(source)).toBe(false);
	});
});
