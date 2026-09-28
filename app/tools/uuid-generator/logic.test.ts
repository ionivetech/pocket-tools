import { describe, expect, test } from "bun:test";
import {
	convertId,
	formatId,
	generateUlid,
	generateUuidV4,
	generateUuidV7,
	inspectId,
	runUuidGenerator,
} from "./logic";
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

describe("inspectId", () => {
	test("detects UUID v4 without a timestamp", () => {
		const inspected = inspectId(generateUuidV4());
		expect(inspected.kind).toBe("uuid-v4");
		if (inspected.kind === "uuid-v4") {
			expect(inspected.version).toBe(4);
			expect(inspected.timestampMs).toBeNull();
		}
	});

	test("detects UUID v7 with its embedded timestamp", () => {
		const inspected = inspectId(generateUuidV7(1_700_000_000_000));
		expect(inspected).toMatchObject({
			kind: "uuid-v7",
			version: 7,
			timestampMs: 1_700_000_000_000,
		});
	});

	test("detects ULIDs with their embedded timestamp", () => {
		const inspected = inspectId(generateUlid(1_700_000_000_000));
		expect(inspected.kind).toBe("ulid");
		if (inspected.kind === "ulid") {
			expect(inspected.timestampMs).toBe(1_700_000_000_000);
		}
	});

	test("accepts bare 32-hex UUIDs", () => {
		expect(inspectId("550e8400e29b41d4a716446655440000")).toMatchObject({
			kind: "uuid-v4",
			normalized: "550e8400-e29b-41d4-a716-446655440000",
		});
	});

	test("detects the nil UUID", () => {
		expect(inspectId("00000000-0000-0000-0000-000000000000").kind).toBe("nil");
	});

	test("rejects non-ids", () => {
		expect(inspectId("not an id").kind).toBe("invalid");
		expect(inspectId("").kind).toBe("invalid");
	});
});

describe("convertId", () => {
	test("converts UUID v7 to ULID keeping the timestamp", () => {
		const converted = convertId(generateUuidV7(1_700_000_000_000), "ulid");
		expect(converted.ok).toBe(true);
		if (converted.ok) {
			expect(converted.value.result).toMatch(ulidPattern);
			expect(converted.value.timestampMs).toBe(1_700_000_000_000);
			expect(inspectId(converted.value.result)).toMatchObject({
				kind: "ulid",
				timestampMs: 1_700_000_000_000,
			});
		}
	});

	test("converts ULID to UUID v7 keeping the timestamp", () => {
		const converted = convertId(generateUlid(1_700_000_000_000), "uuid-v7");
		expect(converted.ok).toBe(true);
		if (converted.ok) {
			expect(converted.value.result).toMatch(uuidPattern);
			expect(converted.value.result.charAt(14)).toBe("7");
			expect(inspectId(converted.value.result)).toMatchObject({
				kind: "uuid-v7",
				timestampMs: 1_700_000_000_000,
			});
		}
	});

	test("refuses UUID v4 with a specific error", () => {
		expect(convertId(generateUuidV4(), "ulid")).toMatchObject({
			ok: false,
			error: { code: "no_timestamp" },
		});
	});

	test("refuses invalid input with a specific error", () => {
		expect(convertId("nope", "ulid")).toMatchObject({
			ok: false,
			error: { code: "invalid_id" },
		});
	});
});

describe("formatId", () => {
	const sample = "550e8400-e29b-41d4-a716-446655440000";

	test("lowercases by default and strips hyphens on demand", () => {
		expect(formatId(sample, {})).toBe(sample);
		expect(formatId(sample, { hyphens: false })).toBe("550e8400e29b41d4a716446655440000");
	});

	test("uppercases UUIDs and ULIDs", () => {
		expect(formatId(sample, { uppercase: true })).toBe(sample.toUpperCase());
		expect(formatId("01h455vb4pex5vsknk084sn02q", { uppercase: true })).toBe(
			"01H455VB4PEX5VSKNK084SN02Q",
		);
	});

	test("keeps ULIDs canonical uppercase even when the toggle is off", () => {
		expect(formatId("01h455vb4pex5vsknk084sn02q", {})).toBe("01H455VB4PEX5VSKNK084SN02Q");
	});
});
