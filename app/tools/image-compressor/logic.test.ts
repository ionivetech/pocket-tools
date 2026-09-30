import { describe, expect, test } from "bun:test";
import { planImageCompression } from "./logic";

const FILE = {
	fileName: "photo.png",
	fileType: "image/png",
	fileSize: 1000,
	quality: 0.8,
	outputType: "image/webp",
} as const;

describe("image-compressor", () => {
	test("accepts a supported image and settings", () => {
		expect(planImageCompression({ ...FILE })).toMatchObject({ ok: true });
	});

	test("asks for a file when nothing is chosen", () => {
		expect(planImageCompression({ ...FILE, fileSize: 0 })).toMatchObject({
			ok: false,
			error: { code: "no_file" },
		});
	});

	test("guards the 10 MB ceiling", () => {
		expect(planImageCompression({ ...FILE, fileSize: 11 * 1024 * 1024 })).toMatchObject({
			ok: false,
			error: { code: "file_too_large" },
		});
	});

	test("rejects unsupported types and bad quality", () => {
		expect(planImageCompression({ ...FILE, fileType: "application/pdf" })).toMatchObject({
			ok: false,
			error: { code: "unsupported_type" },
		});
		expect(planImageCompression({ ...FILE, quality: 5 })).toMatchObject({
			ok: false,
			error: { code: "invalid_quality" },
		});
	});
});
