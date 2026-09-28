import { describe, expect, test } from "bun:test";
import { runBase64Tool } from "./logic";
import { parseBase64ToolInput } from "./schema";

describe("base64-tool scaffold", () => {
	test("rejects a non-string text value", () => {
		expect(parseBase64ToolInput({ text: 1 })).toMatchObject({
			ok: false,
			error: { code: "invalid_input" },
		});
	});

	test("keeps the empty-state contract until the tool is implemented", () => {
		expect(runBase64Tool({ text: "" })).toMatchObject({
			ok: false,
			error: { code: "not_implemented" },
		});
	});
});
