import type { Result } from "../../types/tool";

export type UuidGeneratorVersion = "uuid-v4" | "uuid-v7" | "ulid";

export type UuidGeneratorInput = Readonly<{
	version: UuidGeneratorVersion;
	count: number;
}>;

export const uuidGeneratorMinCount = 1;
export const uuidGeneratorMaxCount = 100;

const versionValues = [
	"uuid-v4",
	"uuid-v7",
	"ulid",
] as const satisfies readonly UuidGeneratorVersion[];

export function isUuidGeneratorVersion(value: unknown): value is UuidGeneratorVersion {
	return (versionValues as readonly unknown[]).includes(value);
}

/**
 * Validates the generator's input shape: which identifier version, and how
 * many to generate in one batch.
 *
 * @example
 * ```ts
 * parseUuidGeneratorInput({ version: "uuid-v4", count: 5 }).ok; // true
 * parseUuidGeneratorInput({ version: "uuid-v4", count: 0 }).ok; // false
 * ```
 */
export function parseUuidGeneratorInput(value: unknown): Result<UuidGeneratorInput> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return { ok: false, error: { code: "invalid_input", message: "Input must be an object." } };
	}

	const { version, count } = value as Record<string, unknown>;

	if (!isUuidGeneratorVersion(version)) {
		return {
			ok: false,
			error: { code: "invalid_input", message: 'Version must be "uuid-v4", "uuid-v7", or "ulid".' },
		};
	}
	if (
		typeof count !== "number" ||
		!Number.isInteger(count) ||
		count < uuidGeneratorMinCount ||
		count > uuidGeneratorMaxCount
	) {
		return {
			ok: false,
			error: {
				code: "invalid_input",
				message: `Count must be a whole number from ${uuidGeneratorMinCount} to ${uuidGeneratorMaxCount}.`,
			},
		};
	}

	return { ok: true, value: { version, count } };
}
