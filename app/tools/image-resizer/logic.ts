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

export type ImageResizerOutput = Readonly<{
	fileName: string;
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
 * Validates the picked file and the requested width before any canvas work.
 *
 * @example
 * ```ts
 * planImageResize({ fileName: "a.jpg", fileType: "image/jpeg", fileSize: 900, targetWidth: 800, keepRatio: true, outputType: "image/png" }).ok; // true
 * ```
 */
export function planImageResize(input: ImageResizerInput): Result<ImageResizerOutput> {
	if (input.fileSize <= 0) {
		return { ok: false, error: { code: "no_file", message: "Choose an image first." } };
	}
	if (input.fileSize > IMAGE_MAX_BYTES) {
		return {
			ok: false,
			error: {
				code: "file_too_large",
				message: `That image is over ${Math.round(IMAGE_MAX_BYTES / (1024 * 1024))} MB. Resize it on your device first, or pick a smaller photo.`,
			},
		};
	}
	if (!isSupportedImageType(input.fileType)) {
		return {
			ok: false,
			error: {
				code: "unsupported_type",
				message: "Choose a JPEG, PNG, WebP, GIF or BMP image.",
			},
		};
	}
	if (!Number.isInteger(input.targetWidth) || input.targetWidth < 1 || input.targetWidth > 8000) {
		return {
			ok: false,
			error: { code: "invalid_width", message: "Width must be a whole number from 1 to 8000." },
		};
	}
	if (!(IMAGE_OUTPUT_TYPES as readonly string[]).includes(input.outputType)) {
		return {
			ok: false,
			error: { code: "invalid_width", message: "Pick JPEG, WebP or PNG as the output format." },
		};
	}
	return {
		ok: true,
		value: {
			fileName: input.fileName,
			targetWidth: input.targetWidth,
			keepRatio: input.keepRatio,
			outputType: input.outputType,
		},
	};
}
