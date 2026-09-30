import type { Result } from "../../types/tool";

export const HASH_ALGORITHMS = ["SHA-256", "SHA-384", "SHA-512", "SHA-1"] as const;
export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number];

export const HASH_ENCODINGS = ["hex", "base64"] as const;
export type HashEncoding = (typeof HASH_ENCODINGS)[number];

export type HashGeneratorInput = Readonly<{
	text: string;
	algorithm: HashAlgorithm;
	encoding: HashEncoding;
}>;

/**
 * Narrows an unknown value to a supported hash method.
 *
 * @example
 * ```ts
 * isHashAlgorithm("SHA-256"); // true
 * ```
 */
export function isHashAlgorithm(value: unknown): value is HashAlgorithm {
	return typeof value === "string" && (HASH_ALGORITHMS as readonly string[]).includes(value);
}

/**
 * Narrows an unknown value to a supported output encoding.
 *
 * @example
 * ```ts
 * isHashEncoding("hex"); // true
 * ```
 */
export function isHashEncoding(value: unknown): value is HashEncoding {
	return typeof value === "string" && (HASH_ENCODINGS as readonly string[]).includes(value);
}

/**
 * Manual parser for this tool's input shape.
 *
 * @example
 * ```ts
 * parseHashGeneratorInput({ text: "hi", algorithm: "SHA-256", encoding: "hex" }).ok; // true
 * parseHashGeneratorInput({ text: 1 }).error.code; // "invalid_input"
 * ```
 */
export function parseHashGeneratorInput(value: unknown): Result<HashGeneratorInput> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Input must be an object." },
		};
	}
	const record = value as {
		readonly text?: unknown;
		readonly algorithm?: unknown;
		readonly encoding?: unknown;
	};
	if (typeof record.text !== "string") {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Text must be a string." },
		};
	}
	if (!isHashAlgorithm(record.algorithm)) {
		return {
			ok: false,
			error: {
				code: "invalid_input",
				message: `Algorithm must be one of ${HASH_ALGORITHMS.join(", ")}.`,
			},
		};
	}
	if (!isHashEncoding(record.encoding)) {
		return {
			ok: false,
			error: {
				code: "invalid_input",
				message: `Encoding must be one of ${HASH_ENCODINGS.join(", ")}.`,
			},
		};
	}
	return {
		ok: true,
		value: { text: record.text, algorithm: record.algorithm, encoding: record.encoding },
	};
}
