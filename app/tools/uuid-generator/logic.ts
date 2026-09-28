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
	return buildUuidV7(now, randomBytes(10));
}

function buildUuidV7(now: number, rand: Uint8Array): string {
	const bytes = new Uint8Array(16);
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
	return buildUlid(now, randomBytes(16));
}

function buildUlid(now: number, rand: Uint8Array): string {
	return encodeCrockfordTime(now, 10) + encodeCrockfordRandom(rand);
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const bareUuidPattern = /^[0-9a-f]{32}$/i;
const ulidPattern = /^[0-9a-hjkmnp-tv-z]{26}$/i;
const nilUuid = "00000000-0000-0000-0000-000000000000";

export type InspectedId =
	| Readonly<{ kind: "invalid" }>
	| Readonly<{ kind: "nil"; normalized: string }>
	| Readonly<{
			kind: "uuid-v4" | "uuid-v7" | "uuid";
			normalized: string;
			version: number;
			timestampMs: number | null;
	  }>
	| Readonly<{ kind: "ulid"; normalized: string; timestampMs: number }>;

export type IdConvertTarget = "uuid-v7" | "ulid";

export type IdConvertOutput = Readonly<{
	result: string;
	sourceKind: InspectedId["kind"];
	targetKind: IdConvertTarget;
	timestampMs: number;
}>;

function decodeCrockfordTime(value: string): number {
	let result = 0;
	for (const char of value) {
		result = result * 32 + crockfordAlphabet.indexOf(char.toUpperCase());
	}
	return result;
}

function normalizeUuid(value: string): string {
	const compact = value.replaceAll("-", "").toLowerCase();
	return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`;
}

/**
 * Identifies a pasted value: UUID (with version + v7 timestamp), ULID (with
 * timestamp), nil UUID, or invalid. Accepts hyphenated and bare UUIDs.
 *
 * @example
 * ```ts
 * inspectId("00000000-0000-0000-0000-000000000000").kind; // "nil"
 * inspectId("not an id").kind; // "invalid"
 * ```
 */
export function inspectId(value: string): InspectedId {
	const trimmed = value.trim();
	if (trimmed.toLowerCase() === nilUuid) {
		return { kind: "nil", normalized: nilUuid };
	}
	if (uuidPattern.test(trimmed) || bareUuidPattern.test(trimmed)) {
		const normalized = normalizeUuid(trimmed);
		const version = Number.parseInt(normalized.slice(14, 15), 16);
		const timestampMs =
			version === 7 ? Number.parseInt(normalized.replaceAll("-", "").slice(0, 12), 16) : null;
		if (version === 4) {
			return { kind: "uuid-v4", normalized, version, timestampMs };
		}
		if (version === 7) {
			return { kind: "uuid-v7", normalized, version, timestampMs };
		}
		return { kind: "uuid", normalized, version, timestampMs };
	}
	if (ulidPattern.test(trimmed)) {
		const normalized = trimmed.toUpperCase();
		return { kind: "ulid", normalized, timestampMs: decodeCrockfordTime(normalized.slice(0, 10)) };
	}
	return { kind: "invalid" };
}

/**
 * Converts between UUID v7 and ULID keeping the millisecond timestamp, with
 * fresh randomness. Only timestamp-carrying ids convert: v4, other versions,
 * nil, and invalid values return a specific error instead of guessing.
 *
 * @example
 * ```ts
 * convertId(generateUuidV7(), "ulid").ok; // true
 * convertId(generateUuidV4(), "ulid").ok; // false
 * ```
 */
export function convertId(value: string, target: IdConvertTarget): Result<IdConvertOutput> {
	const inspected = inspectId(value);
	if (inspected.kind !== "uuid-v7" && inspected.kind !== "ulid") {
		if (inspected.kind === "invalid") {
			return {
				ok: false,
				error: { code: "invalid_id", message: "That is not a UUID or ULID." },
			};
		}
		return {
			ok: false,
			error: {
				code: "no_timestamp",
				message: "Conversion needs a UUID v7 or a ULID, because only they carry a timestamp.",
			},
		};
	}

	const timestampMs = inspected.timestampMs;
	if (timestampMs === null) {
		return {
			ok: false,
			error: {
				code: "no_timestamp",
				message: "Conversion needs a UUID v7 or a ULID, because only they carry a timestamp.",
			},
		};
	}
	const result =
		target === "ulid"
			? buildUlid(timestampMs, randomBytes(16))
			: buildUuidV7(timestampMs, randomBytes(10));
	return {
		ok: true,
		value: { result, sourceKind: inspected.kind, targetKind: target, timestampMs },
	};
}

/**
 * Applies display formatting: letter case for UUIDs, hyphens for UUIDs only.
 * ULIDs always render uppercase (their canonical Crockford form), so the
 * case toggle never corrupts them into an unfamiliar shape.
 *
 * @example
 * ```ts
 * formatId("550e8400-e29b-41d4-a716-446655440000", { uppercase: true, hyphens: false });
 * // "550E8400E29B41D4A716446655440000"
 * ```
 */
export function formatId(
	value: string,
	options: Readonly<{ uppercase?: boolean; hyphens?: boolean }>,
): string {
	if (ulidPattern.test(value)) {
		return value.toUpperCase();
	}
	const upper = options.uppercase === true ? value.toUpperCase() : value.toLowerCase();
	if (options.hyphens === false && uuidPattern.test(upper)) {
		return upper.replaceAll("-", "");
	}
	return upper;
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
