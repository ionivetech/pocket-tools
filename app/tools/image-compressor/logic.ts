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

export type ImageCompressorOutput = Readonly<{
	fileName: string;
	quality: number;
	outputType: ImageOutputType;
}>;

export type ImageCompressorErrorCode =
	| "no_file"
	| "file_too_large"
	| "unsupported_type"
	| "invalid_quality";

/**
 * Validates the picked file and the chosen compression settings before any
 * canvas work, so a 40 MB photo never freezes the page.
 *
 * @example
 * ```ts
 * planImageCompression({ fileName: "a.png", fileType: "image/png", fileSize: 1000, quality: 0.8, outputType: "image/webp" }).ok; // true
 * planImageCompression({ fileName: "a.exe", fileType: "application/pdf", fileSize: 10, quality: 0.8, outputType: "image/webp" }).error.code; // "unsupported_type"
 * ```
 */
export function planImageCompression(input: ImageCompressorInput): Result<ImageCompressorOutput> {
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
	if (!Number.isFinite(input.quality) || input.quality < 0.1 || input.quality > 1) {
		return {
			ok: false,
			error: { code: "invalid_quality", message: "Quality must be between 10 and 100." },
		};
	}
	if (!(IMAGE_OUTPUT_TYPES as readonly string[]).includes(input.outputType)) {
		return {
			ok: false,
			error: {
				code: "invalid_quality",
				message: "Pick JPEG, WebP or PNG as the output format.",
			},
		};
	}
	return {
		ok: true,
		value: {
			fileName: input.fileName,
			quality: input.quality,
			outputType: input.outputType,
		},
	};
}
