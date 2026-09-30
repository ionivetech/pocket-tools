import { describe, expect, test } from "bun:test";
import {
	formatBytes,
	isSupportedImageType,
	outputExtension,
	outputLabel,
	savingsLabel,
	targetSize,
} from "../../app/utils/image-metrics";

describe("image-metrics", () => {
	test("recognises drawable image types", () => {
		expect(isSupportedImageType("image/png")).toBe(true);
		expect(isSupportedImageType("IMAGE/JPEG")).toBe(true);
		expect(isSupportedImageType("application/pdf")).toBe(false);
	});

	test("formats byte sizes for people", () => {
		expect(formatBytes(512)).toBe("512 B");
		expect(formatBytes(1536)).toBe("1.5 KB");
		expect(formatBytes(2 * 1024 * 1024)).toBe("2.0 MB");
	});

	test("reports savings and the bigger-file case", () => {
		expect(savingsLabel(1000, 400)).toBe("Saved 60% (1000 B → 400 B)");
		expect(savingsLabel(1000, 1200)).toBe(
			"Bigger than the original — lower the quality or pick a smaller size.",
		);
	});

	test("names output formats and extensions", () => {
		expect(outputLabel("image/webp")).toBe("WebP (best for sharing)");
		expect(outputExtension("image/jpeg")).toBe("jpg");
	});

	test("keeps the aspect ratio on request and squares without it", () => {
		expect(targetSize(1600, 900, 800, true)).toEqual({ width: 800, height: 450 });
		expect(targetSize(1600, 900, 800, false)).toEqual({ width: 800, height: 800 });
		expect(targetSize(1600, 900, 0, true)).toEqual({ width: 1, height: 1 });
	});
});
