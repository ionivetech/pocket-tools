/**
 * Reed-Solomon and bit-packing primitives for the QR writer.
 *
 * Extracted from `qr-encode.ts` so the QR-specific geometry stays in one file:
 * this module is pure GF(256) arithmetic with no knowledge of modules, masks or
 * versions, and can be reasoned about (and tested) on its own.
 */

/** The error-correction levels this writer supports (Q and H are out of scope). */
export type QrErrorCorrection = "L" | "M";

const EXP_TABLE: number[] = Array.from({ length: 512 }, () => 0);
const LOG_TABLE: number[] = Array.from({ length: 256 }, () => 0);

(function initGaloisTables(): void {
	let value = 1;
	for (let index = 0; index < 255; index += 1) {
		EXP_TABLE[index] = value;
		LOG_TABLE[value] = index;
		value <<= 1;
		if (value > 255) {
			value ^= 0x11d;
		}
	}
	for (let index = 255; index < 512; index += 1) {
		EXP_TABLE[index] = EXP_TABLE[index - 255]!;
	}
})();

/** Multiplies two GF(256) elements (the QR field, primitive polynomial 0x11d). */
function galoisMultiply(left: number, right: number): number {
	if (left === 0 || right === 0) {
		return 0;
	}
	return EXP_TABLE[LOG_TABLE[left]! + LOG_TABLE[right]!]!;
}

/**
 * Generator polynomial of the given degree: the product of (x + a^i), returned
 * highest-degree first.
 *
 * The inner loop grows the polynomial constant-first, so the result is reversed
 * on the way out. `rsRemainder` divides with the leading coefficient first (that
 * is the term that cancels each leading byte), so handing it a constant-first
 * array silently produces parity bytes that satisfy no codeword at all — the
 * ISO/IEC 18004 syndrome check in tests/unit/qr-codec.test.ts is what pins this.
 */
function rsDivisor(degree: number): number[] {
	let poly = [1];
	for (let index = 0; index < degree; index += 1) {
		const next: number[] = Array.from({ length: poly.length + 1 }, () => 0);
		for (let j = 0; j < poly.length; j += 1) {
			next[j] = next[j]! ^ galoisMultiply(poly[j]!, EXP_TABLE[index]!);
			next[j + 1] = next[j + 1]! ^ poly[j]!;
		}
		poly = next;
	}
	return poly.reverse();
}

/**
 * Computes the Reed-Solomon error-correction codewords for one block.
 *
 * @example
 * ```ts
 * rsRemainder([0x40, 0xd2, 0x75, 0x47, 0x76, 0x17, 0x32, 0x06, 0x27, 0x26, 0x96, 0xc6, 0xc6, 0x96, 0x70, 0xec], 10).length; // 10
 * ```
 */
export function rsRemainder(data: readonly number[], degree: number): number[] {
	const divisor = rsDivisor(degree);
	const work = [...data, ...Array.from({ length: degree }, () => 0)];
	for (let index = 0; index < data.length; index += 1) {
		const factor = work[index]!;
		if (factor !== 0) {
			for (let j = 0; j <= degree; j += 1) {
				work[index + j] = work[index + j]! ^ galoisMultiply(divisor[j]!, factor);
			}
		}
	}
	return work.slice(data.length);
}

/**
 * Appends the low `length` bits of `value`, most significant bit first.
 *
 * @example
 * ```ts
 * const bits: number[] = [];
 * pushBits(bits, 0b0100, 4); // bits is now [0, 1, 0, 0]
 * ```
 */
export function pushBits(target: number[], value: number, length: number): void {
	for (let index = length - 1; index >= 0; index -= 1) {
		target.push((value >>> index) & 1);
	}
}
