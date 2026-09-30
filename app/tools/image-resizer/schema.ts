import type { Result } from "../../types/tool";
import {
	IMAGE_MAX_BYTES,
	IMAGE_OUTPUT_TYPES,
	isSupportedImageType,
	type ImageOutputType,
} from "../../utils/image-metrics";

export type ImageResizerInput = Readonly<{
	fileName: string;
	fileType: string;
	fileSize: number;
	targetWidth: number;
	keepRatio: boolean;
	outputType: ImageOutputType;
}>;

export type ImageResizerErrorCode =
	| "no_file"
	| "file_too_large"
	| "unsupported_type"
	| "invalid_width";

/**
 * Manual parser for this tool's input shape, including the 10 MB guard that
 * runs before any canvas work.
 *
 * @example
 * ```ts
 * parseImageResizerInput({ fileName: "a.jpg", fileType: "image/jpeg", fileSize: 900, targetWidth: 800, keepRatio: true, outputType: "image/png" }).ok; // true
 * parseImageResizerInput({ fileName: "a.jpg", fileType: "image/jpeg", fileSize: 900, targetWidth: 0, keepRatio: true, outputType: "image/png" }).error.code; // "invalid_width"
 * ```
 */
export function parseImageResizerInput(value: unknown): Result<ImageResizerInput> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return { ok: false, error: { code: "no_file", message: "Choose an image first." } };
	}
	const record = value as {
		readonly fileName?: unknown;
		readonly fileType?: unknown;
		readonly fileSize?: unknown;
		readonly targetWidth?: unknown;
		readonly keepRatio?: unknown;
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
		typeof record.targetWidth !== "number" ||
		!Number.isInteger(record.targetWidth) ||
		record.targetWidth < 1 ||
		record.targetWidth > 8000
	) {
		return {
			ok: false,
			error: { code: "invalid_width", message: "Width must be a whole number from 1 to 8000." },
		};
	}
	if (
		typeof record.outputType !== "string" ||
		!(IMAGE_OUTPUT_TYPES as readonly string[]).includes(record.outputType)
	) {
		return {
			ok: false,
			error: { code: "invalid_width", message: "Pick JPEG, WebP or PNG as the output format." },
		};
	}
	return {
		ok: true,
		value: {
			fileName: record.fileName,
			fileType: record.fileType,
			fileSize: record.fileSize,
			targetWidth: record.targetWidth,
			keepRatio: record.keepRatio === true,
			outputType: record.outputType as ImageOutputType,
		},
	};
}
