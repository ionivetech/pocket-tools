import { describe, expect, test } from "bun:test";
import { generateUlid, generateUuidV4, generateUuidV7, runUuidGenerator } from "./logic";
import { isUuidGeneratorVersion, parseUuidGeneratorInput } from "./schema";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ulidPattern = /^[0-9A-HJKMNP-TV-Z]{26}$/;

describe("uuid-generator schema", () => {
	test.each(["uuid-v4", "uuid-v7", "ulid"])("accepts version %p", (version) => {
		expect(isUuidGeneratorVersion(version)).toBe(true);
	});

	test("rejects an unsupported version", () => {
		expect(isUuidGeneratorVersion("uuid-v1")).toBe(false);
	});

	test("accepts a count within range", () => {
		expect(parseUuidGeneratorInput({ version: "uuid-v4", count: 10 })).toEqual({
			ok: true,
			value: { version: "uuid-v4", count: 10 },
		});
	});

	test.each([0, 101, 1.5, -1])("rejects an out-of-range or non-integer count %p", (count) => {
		expect(parseUuidGeneratorInput({ version: "uuid-v4", count })).toMatchObject({
			ok: false,
			error: { code: "invalid_input" },
		});
	});
});

describe("generateUuidV4", () => {
	test("matches the UUID shape", () => {
		expect(generateUuidV4()).toMatch(uuidPattern);
	});

	test("sets the version nibble to 4", () => {
		expect(generateUuidV4().charAt(14)).toBe("4");
	});
});

describe("generateUuidV7", () => {
	test("matches the UUID shape with version nibble 7", () => {
		const id = generateUuidV7();
		expect(id).toMatch(uuidPattern);
		expect(id.charAt(14)).toBe("7");
	});

	test("sets the variant bits to 10xxxxxx", () => {
		const id = generateUuidV7();
		const variantNibble = Number.parseInt(id.charAt(19), 16);
		expect(variantNibble & 0b1100).toBe(0b1000);
	});

	test("sorts lexicographically by generation time", () => {
		const earlier = generateUuidV7(1_700_000_000_000);
		const later = generateUuidV7(1_700_000_000_001);
		expect(earlier < later).toBe(true);
	});
});

describe("generateUlid", () => {
	test("matches the ULID shape (26 Crockford base32 characters)", () => {
		expect(generateUlid()).toMatch(ulidPattern);
	});

	test("sorts lexicographically by generation time", () => {
		const earlier = generateUlid(1_700_000_000_000);
		const later = generateUlid(1_700_000_000_001);
		expect(earlier < later).toBe(true);
	});
});

describe("runUuidGenerator", () => {
	test("generates the requested count", () => {
		const result = runUuidGenerator({ version: "uuid-v4", count: 5 });
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.ids).toHaveLength(5);
		}
	});

	test("generates unique ids across a batch", () => {
		const result = runUuidGenerator({ version: "ulid", count: 50 });
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(new Set(result.value.ids).size).toBe(50);
		}
	});

	test("rejects an invalid count", () => {
		expect(runUuidGenerator({ version: "uuid-v4", count: 0 })).toMatchObject({
			ok: false,
			error: { code: "invalid_input" },
		});
	});
});
