import { describe, expect, test } from "bun:test";
import { runColorPicker } from "./logic";
import { parseColorPickerInput } from "./schema";

describe("color-picker", () => {
	test("rejects a non-string color value", () => {
		expect(parseColorPickerInput({ color: 1 })).toMatchObject({
			ok: false,
			error: { code: "invalid_input" },
		});
	});

	test("converts brand blue to rgb and hsl", () => {
		const result = runColorPicker({ color: "#1d4ed8" });
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.rgb).toBe("rgb(29, 78, 216)");
		expect(result.value.hsl).toBe("hsl(224, 76%, 48%)");
		expect(result.value.readableOn).toBe("white");
	});

	test("accepts short hex and rgb() shapes", () => {
		const short = runColorPicker({ color: "#fff" });
		const rgb = runColorPicker({ color: "rgb(0, 0, 0)" });
		const hsl = runColorPicker({ color: "hsl(0, 0%, 100%)" });
		expect(short.ok && rgb.ok && hsl.ok).toBe(true);
		if (!short.ok || !rgb.ok || !hsl.ok) return;
		expect(short.value.hex).toBe("#ffffff");
		expect(rgb.value.hex).toBe("#000000");
		expect(hsl.value.hex).toBe("#ffffff");
	});

	test("reports contrast numbers for white and black", () => {
		const result = runColorPicker({ color: "#ffffff" });
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.contrastWhite).toBe(1);
		expect(result.value.contrastBlack).toBe(21);
		expect(result.value.readableOn).toBe("black");
	});

	test("names bad colors with a code", () => {
		expect(runColorPicker({ color: "" })).toMatchObject({
			ok: false,
			error: { code: "empty_input" },
		});
		expect(runColorPicker({ color: "blurple" })).toMatchObject({
			ok: false,
			error: { code: "invalid_color" },
		});
	});
});
