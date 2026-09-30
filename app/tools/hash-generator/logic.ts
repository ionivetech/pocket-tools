import type { Result } from "../../types/tool";
import { parseHashGeneratorInput, type HashGeneratorInput } from "./schema";

export type HashGeneratorOutput = Readonly<{
	digest: string;
	algorithm: string;
	encoding: string;
	bytes: number;
}>;

function toHex(bytes: Uint8Array): string {
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function toBase64(bytes: Uint8Array): string {
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary);
}

async function digestBytes(text: string, algorithm: string): Promise<Uint8Array> {
	const subtle = globalThis.crypto?.subtle ?? (await import("node:crypto")).webcrypto.subtle;
	const data = new TextEncoder().encode(text);
	const digest = await subtle.digest(algorithm, data);
	return new Uint8Array(digest);
}

/**
 * Hashes text with Web Crypto (SHA-256/384/512, SHA-1 labeled weak-only in
 * the UI). Async by nature — the component shows progress while it runs.
 *
 * @example
 * ```ts
 * (await runHashGenerator({ text: "hello", algorithm: "SHA-256", encoding: "hex" })).value.digest;
 * // "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
 * ```
 */
export async function runHashGenerator(
	input: HashGeneratorInput,
): Promise<Result<HashGeneratorOutput>> {
	const validated = parseHashGeneratorInput(input);
	if (!validated.ok) {
		return validated;
	}
	if (validated.value.text === "") {
		return {
			ok: false,
			error: { code: "empty_input", message: "Type some text to hash first." },
		};
	}
	try {
		const bytes = await digestBytes(validated.value.text, validated.value.algorithm);
		const digest = validated.value.encoding === "hex" ? toHex(bytes) : toBase64(bytes);
		return {
			ok: true,
			value: {
				digest,
				algorithm: validated.value.algorithm,
				encoding: validated.value.encoding,
				bytes: new TextEncoder().encode(validated.value.text).length,
			},
		};
	} catch {
		return {
			ok: false,
			error: { code: "hash_failed", message: "Hashing failed in this browser. Try again." },
		};
	}
}
