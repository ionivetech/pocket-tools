import type { Result } from "../../types/tool";
import { encodeQr, maxBytes, type QrMatrix } from "../../utils/qr-encode";
import type { QrErrorCorrection } from "../../utils/qr-codec";
import { QR_QUIET_ZONE, parseQrGeneratorInput, type QrGeneratorInput } from "./schema";

export type QrGeneratorOutput = Readonly<{
	svg: string;
	size: number;
	version: number;
	ecc: QrErrorCorrection;
	bytes: number;
	maxBytes: number;
}>;

export { maxBytes };

/**
 * Builds an SVG string for a QR matrix: black modules as one path, plus the
 * quiet zone every scanner expects.
 *
 * @example
 * ```ts
 * toQrSvg(encodeQr("hi", "M").value.modules).startsWith("<svg"); // true
 * ```
 */
export function toQrSvg(modules: readonly (readonly boolean[])[], quiet = QR_QUIET_ZONE): string {
	const size = modules.length;
	const side = size + quiet * 2;
	const path: string[] = [];
	modules.forEach((row, y) => {
		row.forEach((dark, x) => {
			if (dark) {
				path.push(`M${x + quiet} ${y + quiet}h1v1h-1z`);
			}
		});
	});
	return [
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${side} ${side}" shape-rendering="crispEdges" role="img" aria-label="QR code">`,
		`<rect width="${side}" height="${side}" fill="#ffffff"/>`,
		`<path d="${path.join("")}" fill="#000000"/>`,
		"</svg>",
	].join("");
}

function fromMatrix(matrix: QrMatrix, text: string): QrGeneratorOutput {
	return {
		svg: toQrSvg(matrix.modules),
		size: matrix.size,
		version: matrix.version,
		ecc: matrix.ecc,
		bytes: new TextEncoder().encode(text).length,
		maxBytes: maxBytes(matrix.ecc),
	};
}

/**
 * Encodes text into a QR matrix and SVG. Capacity is bounded (versions 1-6),
 * so over-long text fails with the limit rather than a silent downgrade.
 *
 * @example
 * ```ts
 * runQrGenerator({ text: "https://pockettools.app", ecc: "M" }).value.version; // 2
 * runQrGenerator({ text: "", ecc: "M" }).error.code; // "empty_input"
 * ```
 */
export function runQrGenerator(input: QrGeneratorInput): Result<QrGeneratorOutput> {
	const validated = parseQrGeneratorInput(input);
	if (!validated.ok) {
		return validated;
	}
	const { text, ecc } = validated.value;
	const matrix = encodeQr(text, ecc);
	if (!matrix.ok) {
		return matrix;
	}
	return { ok: true, value: fromMatrix(matrix.value, text) };
}
