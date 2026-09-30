import { describe, expect, test } from "bun:test";
import { planImageResize } from "./logic";

const FILE = {
	fileName: "photo.jpg",
	fileType: "image/jpeg",
	fileSize: 1000,
	targetWidth: 800,
	keepRatio: true,
	outputType: "image/png",
} as const;

describe("image-resizer", () => {
	test("accepts a supported image and width", () => {
		expect(planImageResize({ ...FILE })).toMatchObject({ ok: true });
	});

	test("asks for a file and guards size and type", () => {
		expect(planImageResize({ ...FILE, fileSize: 0 })).toMatchObject({
			ok: false,
			error: { code: "no_file" },
		});
		expect(planImageResize({ ...FILE, fileSize: 12 * 1024 * 1024 })).toMatchObject({
			ok: false,
			error: { code: "file_too_large" },
		});
		expect(planImageResize({ ...FILE, fileType: "text/plain" })).toMatchObject({
			ok: false,
			error: { code: "unsupported_type" },
		});
	});

	test("rejects widths outside 1-8000", () => {
		expect(planImageResize({ ...FILE, targetWidth: 0 })).toMatchObject({
			ok: false,
			error: { code: "invalid_width" },
		});
		expect(planImageResize({ ...FILE, targetWidth: 9000 })).toMatchObject({
			ok: false,
			error: { code: "invalid_width" },
		});
	});
});
