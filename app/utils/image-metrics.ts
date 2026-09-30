export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export const IMAGE_OUTPUT_TYPES = ["image/jpeg", "image/webp", "image/png"] as const;
export type ImageOutputType = (typeof IMAGE_OUTPUT_TYPES)[number];

const TYPE_LABELS: Readonly<Record<ImageOutputType, string>> = {
	"image/jpeg": "JPEG (smallest file)",
	"image/webp": "WebP (best for sharing)",
	"image/png": "PNG (lossless)",
};

const TYPE_EXTENSIONS: Readonly<Record<ImageOutputType, string>> = {
	"image/jpeg": "jpg",
	"image/webp": "webp",
	"image/png": "png",
};

const INPUT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"];

/**
 * Whether a browser-reported file type can be drawn to a canvas.
 *
 * @example
 * ```ts
 * isSupportedImageType("image/png"); // true
 * isSupportedImageType("application/pdf"); // false
 * ```
 */
export function isSupportedImageType(type: string): boolean {
	return INPUT_TYPES.includes(type.toLowerCase());
}

/**
 * Human file size for the before/after line.
 *
 * @example
 * ```ts
 * formatBytes(1536); // "1.5 KB"
 * ```
 */
export function formatBytes(bytes: number): string {
	if (bytes < 1024) {
		return `${bytes} B`;
	}
	if (bytes < 1024 * 1024) {
		return `${(bytes / 1024).toFixed(1)} KB`;
	}
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Saved-size line, or a warning when the chosen settings made the file bigger.
 *
 * @example
 * ```ts
 * savingsLabel(1000, 400); // "Saved 60%"
 * savingsLabel(1000, 1200); // "Bigger than the original — lower the quality."
 * ```
 */
export function savingsLabel(originalBytes: number, outputBytes: number): string {
	if (outputBytes >= originalBytes) {
		return "Bigger than the original — lower the quality or pick a smaller size.";
	}
	const saved = Math.round((1 - outputBytes / originalBytes) * 100);
	return `Saved ${saved}% (${formatBytes(originalBytes)} → ${formatBytes(outputBytes)})`;
}

/**
 * Picker label for an output format.
 *
 * @example
 * ```ts
 * outputLabel("image/webp"); // "WebP (best for sharing)"
 * ```
 */
export function outputLabel(type: ImageOutputType): string {
	return TYPE_LABELS[type];
}

/**
 * File extension for a download name.
 *
 * @example
 * ```ts
 * outputExtension("image/jpeg"); // "jpg"
 * ```
 */
export function outputExtension(type: ImageOutputType): string {
	return TYPE_EXTENSIONS[type];
}

/**
 * Target size for a resize, keeping the aspect ratio when asked.
 *
 * @example
 * ```ts
 * targetSize(1600, 900, 800, true); // { width: 800, height: 450 }
 * ```
 */
export function targetSize(
	sourceWidth: number,
	sourceHeight: number,
	requested: number,
	keepRatio: boolean,
): { width: number; height: number } {
	const width = Math.max(1, Math.round(requested));
	if (!keepRatio) {
		return { width, height: width };
	}
	const ratio = sourceHeight / sourceWidth;
	return { width, height: Math.max(1, Math.round(width * ratio)) };
}
