import type { Result } from "../../types/tool";
import type { QrErrorCorrection } from "../../utils/qr-codec";

export const QR_ECC_OPTIONS = ["M"] as const;
export const QR_QUIET_ZONE = 4;

export type QrGeneratorInput = Readonly<{ text: string; ecc: QrErrorCorrection }>;

/**
 * Manual parser for this tool's input shape.
 *
 * @example
 * ```ts
 * parseQrGeneratorInput({ text: "hi", ecc: "M" }).ok; // true
 * parseQrGeneratorInput({ text: "hi", ecc: "L" }).error.code; // "invalid_input"
 * ```
 */
export function parseQrGeneratorInput(value: unknown): Result<QrGeneratorInput> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Input must be an object." },
		};
	}
	const record = value as { readonly text?: unknown; readonly ecc?: unknown };
	if (typeof record.text !== "string") {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Text must be a string." },
		};
	}
	if (
		typeof record.ecc !== "string" ||
		!(QR_ECC_OPTIONS as readonly string[]).includes(record.ecc)
	) {
		return {
			ok: false,
			error: { code: "invalid_input", message: "Error correction must be L or M." },
		};
	}
	return { ok: true, value: { text: record.text, ecc: record.ecc as QrErrorCorrection } };
}
