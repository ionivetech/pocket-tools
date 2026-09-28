import { describe, expect, test } from "bun:test";
import { runUuidGenerator } from "./logic";
import { parseUuidGeneratorInput } from "./schema";

describe("uuid-generator scaffold", () => {
	test("rejects a non-string text value", () => {
		expect(parseUuidGeneratorInput({ text: 1 })).toMatchObject({
			ok: false,
			error: { code: "invalid_input" },
		});
	});

	test("keeps the empty-state contract until the tool is implemented", () => {
		expect(runUuidGenerator({ text: "" })).toMatchObject({
			ok: false,
			error: { code: "not_implemented" },
		});
	});
});
