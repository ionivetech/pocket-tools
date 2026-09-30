import type { Result } from "../../types/tool";
import {
	IMAGE_MAX_BYTES,
	IMAGE_OUTPUT_TYPES,
	isSupportedImageType,
	type ImageOutputType,
} from "../../utils/image-metrics";

export type ImageCompressorInput = Readonly<{
	fileName: string;
	fileType: string;
	fileSize: number;
	quality: number;
	outputType: ImageOutputType;
}>;

export type ImageCompressorErrorCode =
	| "no_file"
	| "file_too_large"
	| "unsupported_type"
	| "invalid_quality";

/**
 * Manual parser for this tool's input shape. It is also the 10 MB guard: the
 * check runs before any canvas work, so a huge photo never freezes the page.
 *
 * @example
 * ```ts
 * parseImageCompressorInput({ fileName: "a.png", fileType: "image/png", fileSize: 1000, quality: 0.8, outputType: "image/webp" }).ok; // true
 * parseImageCompressorInput({ fileName: "a.exe", fileType: "application/pdf", fileSize: 10, quality: 0.8, outputType: "image/webp" }).error.code; // "unsupported_type"
 * ```
 */
export function parseImageCompressorInput(value: unknown): Result<ImageCompressorInput> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return {
			ok: false,
			error: { code: "no_file", message: "Choose an image first." },
		};
	}
	const record = value as {
		readonly fileName?: unknown;
		readonly fileType?: unknown;
		readonly fileSize?: unknown;
		readonly quality?: unknown;
		readonly outputType?: unknown;
	};
	if (
		typeof record.fileName !== "string" ||
		typeof record.fileType !== "string" ||
		typeof record.fileSize !== "number"
	) {
		return { ok: false, error: { code: "no_file", message: "Choose an image first." } };
	}
	if (record.fileSize <= 0) {
		return { ok: false, error: { code: "no_file", message: "Choose an image first." } };
	}
	if (record.fileSize > IMAGE_MAX_BYTES) {
		return {
			ok: false,
			error: {
				code: "file_too_large",
				message: `That image is over ${Math.round(IMAGE_MAX_BYTES / (1024 * 1024))} MB. Resize it on your device first, or pick a smaller photo.`,
			},
		};
	}
	if (!isSupportedImageType(record.fileType)) {
		return {
			ok: false,
			error: { code: "unsupported_type", message: "Choose a JPEG, PNG, WebP, GIF or BMP image." },
		};
	}
	if (
		typeof record.quality !== "number" ||
		!Number.isFinite(record.quality) ||
		record.quality < 0.1 ||
		record.quality > 1
	) {
		return {
			ok: false,
			error: { code: "invalid_quality", message: "Quality must be between 10 and 100." },
		};
	}
	if (
		typeof record.outputType !== "string" ||
		!(IMAGE_OUTPUT_TYPES as readonly string[]).includes(record.outputType)
	) {
		return {
			ok: false,
			error: { code: "invalid_quality", message: "Pick JPEG, WebP or PNG as the output format." },
		};
	}
	return {
		ok: true,
		value: {
			fileName: record.fileName,
			fileType: record.fileType,
			fileSize: record.fileSize,
			quality: record.quality,
			outputType: record.outputType as ImageOutputType,
		},
	};
}
