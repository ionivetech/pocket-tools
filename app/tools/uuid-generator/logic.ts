import type { Result } from "../../types/tool";
import {
	parseUuidGeneratorInput,
	type UuidGeneratorInput,
	type UuidGeneratorVersion,
} from "./schema";

export type UuidGeneratorOutput = Readonly<{ ids: readonly string[] }>;

const crockfordAlphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function randomBytes(length: number): Uint8Array {
	const bytes = new Uint8Array(length);
	crypto.getRandomValues(bytes);
	return bytes;
}

function toHex(byte: number): string {
	return byte.toString(16).padStart(2, "0");
}

function formatUuidBytes(bytes: Uint8Array): string {
	const hex = Array.from(bytes, toHex).join("");
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Generates a random (version 4) UUID.
 *
 * @example
 * ```ts
 * generateUuidV4().length; // 36
 * ```
 */
export function generateUuidV4(): string {
	return crypto.randomUUID();
}

/**
 * Generates a time-ordered (version 7, RFC 9562) UUID: a 48-bit millisecond
 * timestamp followed by random bits, so a batch sorts in creation order.
 *
 * @example
 * ```ts
 * generateUuidV7().slice(14, 15); // "7" (the version nibble)
 * ```
 */
export function generateUuidV7(now: number = Date.now()): string {
	const bytes = new Uint8Array(16);
	const rand = randomBytes(10);
	const timestamp = BigInt(Math.max(0, Math.floor(now)));

	for (let index = 0; index < 6; index += 1) {
		bytes[5 - index] = Number((timestamp >> BigInt(index * 8)) & 0xffn);
	}
	bytes[6] = 0x70 | (rand[0]! & 0x0f);
	bytes[7] = rand[1]!;
	bytes[8] = 0x80 | (rand[2]! & 0x3f);
	for (let index = 0; index < 7; index += 1) {
		bytes[9 + index] = rand[3 + index]!;
	}

	return formatUuidBytes(bytes);
}

function encodeCrockfordTime(now: number, length: number): string {
	let remaining = Math.max(0, Math.floor(now));
	let result = "";
	for (let index = 0; index < length; index += 1) {
		const digit = remaining % 32;
		result = crockfordAlphabet[digit] + result;
		remaining = (remaining - digit) / 32;
	}
	return result;
}

function encodeCrockfordRandom(bytes: Uint8Array): string {
	// 256 is an exact multiple of 32, so `byte % 32` is uniform: no modulo bias.
	return Array.from(bytes, (byte) => crockfordAlphabet[byte % 32]).join("");
}

/**
 * Generates a ULID: a 48-bit millisecond timestamp encoded as 10 Crockford
 * base32 characters, followed by 16 characters of randomness.
 *
 * @example
 * ```ts
 * generateUlid().length; // 26
 * ```
 */
export function generateUlid(now: number = Date.now()): string {
	return encodeCrockfordTime(now, 10) + encodeCrockfordRandom(randomBytes(16));
}

const generators: Record<UuidGeneratorVersion, () => string> = {
	"uuid-v4": generateUuidV4,
	"uuid-v7": generateUuidV7,
	ulid: generateUlid,
};

/**
 * Generates a batch of identifiers of the requested version.
 *
 * @example
 * ```ts
 * runUuidGenerator({ version: "uuid-v4", count: 3 }).ok; // true
 * ```
 */
export function runUuidGenerator(input: UuidGeneratorInput): Result<UuidGeneratorOutput> {
	const validated = parseUuidGeneratorInput(input);
	if (!validated.ok) {
		return validated;
	}

	const generate = generators[validated.value.version];
	const ids = Array.from({ length: validated.value.count }, () => generate());

	return { ok: true, value: { ids } };
}
