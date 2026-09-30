import type { Result } from "../types/tool";
import type { QrErrorCorrection } from "./qr-codec";

export type { QrErrorCorrection } from "./qr-codec";
import { pushBits, rsRemainder } from "./qr-codec";
import { drawMatrix, VERSIONS, type VersionInfo } from "./qr-matrix";

export type QrMatrix = Readonly<{
	size: number;
	version: number;
	ecc: QrErrorCorrection;
	modules: readonly (readonly boolean[])[];
}>;

/**
 * Encodes text as a QR matrix (byte mode, error correction L or M, versions
 * 1-6). The matrix is pure data — the Vue component renders it to canvas and
 * offers PNG/SVG download, so this stays unit-testable with no DOM.
 *
 * @example
 * ```ts
 * encodeQr("hi", "M").value.size; // 21
 * encodeQr("", "M").error.code; // "empty_input"
 * ```
 */
export function encodeQr(text: string, ecc: QrErrorCorrection): Result<QrMatrix> {
	if (typeof text !== "string" || text.length === 0) {
		return {
			ok: false,
			error: { code: "empty_input", message: "Type some text or a link first." },
		};
	}
	if (ecc !== "L" && ecc !== "M") {
		return {
			ok: false,
			error: { code: "unsupported_ecc", message: "Error correction must be L or M." },
		};
	}

	const bytes = new TextEncoder().encode(text);
	const info = VERSIONS[ecc].find(
		(candidate) => candidate.dataPerBlock * candidate.blocks - 2 >= bytes.length,
	);
	if (!info) {
		return {
			ok: false,
			error: {
				code: "too_long",
				message: `That is ${bytes.length} bytes; this QR writer holds ${maxBytes(ecc)} bytes. Shorten it or use L.`,
			},
		};
	}

	const dataCodewords = buildDataCodewords(bytes, info);
	const interleaved = interleaveBlocks(dataCodewords, info);
	const bits: number[] = [];
	for (const codeword of interleaved) {
		pushBits(bits, codeword, 8);
	}
	for (let index = 0; index < info.remainder; index += 1) {
		bits.push(0);
	}

	const { modules } = drawMatrix(bits, info, ecc);
	return { ok: true, value: { size: info.size, version: info.version, ecc, modules } };
}

/**
 * Largest encodable byte length for an error correction level.
 *
 * @example
 * ```ts
 * maxBytes("M"); // 106
 * ```
 */
export function maxBytes(ecc: QrErrorCorrection): number {
	const last = VERSIONS[ecc][VERSIONS[ecc].length - 1]!;
	return last.dataPerBlock * last.blocks - 2;
}

function buildDataCodewords(bytes: Uint8Array, info: VersionInfo): number[][] {
	const total = info.dataPerBlock * info.blocks;
	const bits: number[] = [];
	pushBits(bits, 0b0100, 4);
	pushBits(bits, bytes.length, 8);
	for (const byte of bytes) {
		pushBits(bits, byte, 8);
	}
	const capacity = total * 8;
	const terminator = Math.min(4, capacity - bits.length);
	for (let index = 0; index < terminator; index += 1) {
		bits.push(0);
	}
	while (bits.length % 8 !== 0) {
		bits.push(0);
	}
	const codewords: number[] = [];
	for (let index = 0; index < bits.length; index += 8) {
		let codeword = 0;
		for (let j = 0; j < 8; j += 1) {
			codeword = (codeword << 1) | bits[index + j]!;
		}
		codewords.push(codeword);
	}
	for (let pad = 0; codewords.length < total; pad += 1) {
		codewords.push(pad % 2 === 0 ? 0xec : 0x11);
	}

	const blocks: number[][] = [];
	for (let block = 0; block < info.blocks; block += 1) {
		const slice = codewords.slice(block * info.dataPerBlock, (block + 1) * info.dataPerBlock);
		blocks.push([...slice, ...rsRemainder(slice, info.ecPerBlock)]);
	}
	return blocks;
}

function interleaveBlocks(blocks: readonly (readonly number[])[], info: VersionInfo): number[] {
	const out: number[] = [];
	for (let index = 0; index < info.dataPerBlock; index += 1) {
		for (const block of blocks) {
			out.push(block[index]!);
		}
	}
	for (let index = 0; index < info.ecPerBlock; index += 1) {
		for (const block of blocks) {
			out.push(block[info.dataPerBlock + index]!);
		}
	}
	return out;
}
