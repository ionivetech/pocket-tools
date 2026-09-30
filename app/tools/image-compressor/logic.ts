import type { Result } from "../../types/tool";
import { parseImageCompressorInput, type ImageCompressorInput } from "./schema";
import type { ImageOutputType } from "../../utils/image-metrics";

export type ImageCompressorOutput = Readonly<{
	fileName: string;
	quality: number;
	outputType: ImageOutputType;
}>;

/**
 * Validates the picked file and the chosen compression settings, so the canvas
 * step only ever runs on an approved pair.
 *
 * @example
 * ```ts
 * planImageCompression({ fileName: "a.png", fileType: "image/png", fileSize: 1000, quality: 0.8, outputType: "image/webp" }).ok; // true
 * ```
 */
export function planImageCompression(input: ImageCompressorInput): Result<ImageCompressorOutput> {
	const validated = parseImageCompressorInput(input);
	if (!validated.ok) {
		return validated;
	}
	return {
		ok: true,
		value: {
			fileName: validated.value.fileName,
			quality: validated.value.quality,
			outputType: validated.value.outputType,
		},
	};
}
