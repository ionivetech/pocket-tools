import { describe, expect, test } from "bun:test";
import { runHashGenerator } from "./logic";
import { parseHashGeneratorInput } from "./schema";

describe("hash-generator", () => {
	test("rejects a non-string text value", () => {
		expect(parseHashGeneratorInput({ text: 1 })).toMatchObject({
			ok: false,
			error: { code: "invalid_input" },
		});
	});

	test("rejects an unknown algorithm", () => {
		expect(
			parseHashGeneratorInput({ text: "hi", algorithm: "MD5", encoding: "hex" }),
		).toMatchObject({ ok: false, error: { code: "invalid_input" } });
	});

	test("hashes hello with SHA-256 to the known vector", async () => {
		const result = await runHashGenerator({
			text: "hello",
			algorithm: "SHA-256",
			encoding: "hex",
		});
		expect(result).toMatchObject({
			ok: true,
			value: {
				digest: "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
				bytes: 5,
			},
		});
	});

	test("encodes the same digest as base64 on request", async () => {
		const hex = await runHashGenerator({ text: "hello", algorithm: "SHA-256", encoding: "hex" });
		const b64 = await runHashGenerator({
			text: "hello",
			algorithm: "SHA-256",
			encoding: "base64",
		});
		expect(hex.ok && b64.ok).toBe(true);
		if (!hex.ok || !b64.ok) return;
		expect(b64.value.digest).not.toBe(hex.value.digest);
		expect(b64.value.digest.length).toBeGreaterThan(20);
	});

	test("rejects empty input with a code", async () => {
		expect(
			await runHashGenerator({ text: "", algorithm: "SHA-256", encoding: "hex" }),
		).toMatchObject({ ok: false, error: { code: "empty_input" } });
	});
});
