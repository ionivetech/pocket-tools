import type { Result } from "../../types/tool";
import { parseImageResizerInput, type ImageResizerInput } from "./schema";
import type { ImageOutputType } from "../../utils/image-metrics";

export type ImageResizerOutput = Readonly<{
	fileName: string;
	targetWidth: number;
	keepRatio: boolean;
	outputType: ImageOutputType;
}>;

/**
 * Validates the picked file and the requested width, so the canvas step only
 * ever runs on an approved plan.
 *
 * @example
 * ```ts
 * planImageResize({ fileName: "a.jpg", fileType: "image/jpeg", fileSize: 900, targetWidth: 800, keepRatio: true, outputType: "image/png" }).ok; // true
 * ```
 */
export function planImageResize(input: ImageResizerInput): Result<ImageResizerOutput> {
	const validated = parseImageResizerInput(input);
	if (!validated.ok) {
		return validated;
	}
	return {
		ok: true,
		value: {
			fileName: validated.value.fileName,
			targetWidth: validated.value.targetWidth,
			keepRatio: validated.value.keepRatio,
			outputType: validated.value.outputType,
		},
	};
}
