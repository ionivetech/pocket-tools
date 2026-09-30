import { describe, expect, test } from "bun:test";
import {
	encodeQr,
	maxBytes,
	type QrErrorCorrection,
	type QrMatrix,
} from "../../app/utils/qr-encode";

/**
 * An independent QR reader used to prove the encoder round-trips.
 *
 * Everything it needs is written out from ISO/IEC 18004 ON PURPOSE: the block
 * layout, the geometry and the format-info BCH are hard-coded here rather than
 * imported from `qr-encode.ts`. Sharing the encoder's own tables would only
 * prove self-consistency; a wrong mask, a wrong zig-zag order, a wrong
 * interleave or a misplaced format strip all pass such a test and still produce
 * an unscannable code.
 *
 * It covers byte mode at error-correction M for versions 1-6, the full range the
 * tool's writer produces.
 */

type SpecVersion = Readonly<{
	size: number;
	blocks: number;
	dataPerBlock: number;
	ecPerBlock: number;
	remainder: number;
	alignment: readonly number[];
}>;

const SPEC_M: Readonly<Record<number, SpecVersion>> = {
	1: { size: 21, blocks: 1, dataPerBlock: 16, ecPerBlock: 10, remainder: 0, alignment: [] },
	2: { size: 25, blocks: 1, dataPerBlock: 28, ecPerBlock: 16, remainder: 7, alignment: [6, 18] },
	3: { size: 29, blocks: 1, dataPerBlock: 44, ecPerBlock: 26, remainder: 7, alignment: [6, 22] },
	4: { size: 33, blocks: 2, dataPerBlock: 32, ecPerBlock: 18, remainder: 7, alignment: [6, 26] },
	5: { size: 37, blocks: 2, dataPerBlock: 43, ecPerBlock: 24, remainder: 7, alignment: [6, 30] },
	6: { size: 41, blocks: 4, dataPerBlock: 27, ecPerBlock: 16, remainder: 7, alignment: [6, 34] },
};

const FORMAT_GENERATOR = 0b10100110111;
const FORMAT_MASK = 0b101010000010010;

function alignmentCenters(version: number): number[] {
	return SPEC_M[version]?.alignment ?? [];
}

/** Marks every module the data stream must skip, derived from the spec geometry. */
function functionModules(version: number, size: number): boolean[][] {
	const map = Array.from({ length: size }, () => Array.from({ length: size }, () => false));
	const mark = (x: number, y: number): void => {
		if (x >= 0 && x < size && y >= 0 && y < size) {
			map[y]![x] = true;
		}
	};

	// Three finder patterns plus their one-module separators.
	for (const [originX, originY] of [
		[0, 0],
		[size - 7, 0],
		[0, size - 7],
	] as const) {
		for (let dy = -1; dy <= 7; dy += 1) {
			for (let dx = -1; dx <= 7; dx += 1) {
				mark(originX + dx, originY + dy);
			}
		}
	}

	// Timing patterns.
	for (let i = 8; i < size - 8; i += 1) {
		mark(i, 6);
		mark(6, i);
	}

	// Alignment patterns, skipping the three that collide with finders.
	const centers = alignmentCenters(version);
	const last = centers.length - 1;
	for (let i = 0; i <= last; i += 1) {
		for (let j = 0; j <= last; j += 1) {
			// The three patterns at (first,first), (first,last) and (last,first)
			// would overlap a finder pattern, so the spec omits them.
			if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) {
				continue;
			}
			for (let dy = -2; dy <= 2; dy += 1) {
				for (let dx = -2; dx <= 2; dx += 1) {
					mark(centers[i]! + dx, centers[j]! + dy);
				}
			}
		}
	}

	// Format information: the 15-module strip beside the top-left finder and the
	// 15-module strip under it, plus the single dark module at (8, size - 8).
	for (let i = 0; i <= 8; i += 1) {
		mark(8, i);
		mark(i, 8);
	}
	for (let i = 0; i < 8; i += 1) {
		mark(size - 1 - i, 8);
	}
	for (let i = 0; i < 8; i += 1) {
		mark(8, size - 1 - i);
	}
	return map;
}

/** Reads and BCH-checks the format information, returning the mask it names. */
function readFormat(modules: readonly (readonly boolean[])[], size: number): number {
	if (size < 21) {
		throw new Error(`matrix is too small to carry format info: ${size}`);
	}
	const bits: number[] = [];
	// Copy 1: (8,0..5), (8,7), (8,8), (7,8), (5..0, 8)
	for (let i = 0; i <= 5; i += 1) {
		bits.push(modules[i]![8] ? 1 : 0);
	}
	bits.push(modules[7]![8] ? 1 : 0, modules[8]![8] ? 1 : 0, modules[8]![7] ? 1 : 0);
	for (let i = 5; i >= 0; i -= 1) {
		bits.push(modules[8]![i] ? 1 : 0);
	}
	let value = 0;
	for (const bit of bits) {
		value = (value << 1) | bit;
	}
	const unmasked = value ^ FORMAT_MASK;
	// The top 5 bits are the payload (2 bits ECC level, 3 bits mask). Rebuilding
	// the whole word from them checks the BCH remainder and the XOR mask in one
	// comparison, instead of trusting the received remainder.
	const payload = unmasked >>> 10;
	let remainder = payload;
	for (let i = 0; i < 10; i += 1) {
		remainder = (remainder << 1) ^ ((remainder >>> 9) * FORMAT_GENERATOR);
	}
	if ((((payload << 10) | (remainder & 0b1111111111)) ^ FORMAT_MASK) !== value) {
		throw new Error(`format information failed its BCH check (raw ${value})`);
	}
	if (((payload >>> 3) & 0b11) !== 0) {
		throw new Error("ecc level bits must be 00 for level M");
	}
	return payload & 0b111;
}

function maskBit(mask: number, y: number, x: number): boolean {
	switch (mask) {
		case 0:
			return (y + x) % 2 === 0;
		case 1:
			return y % 2 === 0;
		case 2:
			return x % 3 === 0;
		case 3:
			return (y + x) % 3 === 0;
		case 4:
			return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
		case 5:
			return ((y * x) % 2) + ((y * x) % 3) === 0;
		case 6:
			return (((y * x) % 2) + ((y * x) % 3)) % 2 === 0;
		default:
			return (((y + x) % 2) + ((y * x) % 3)) % 2 === 0;
	}
}

/** Walks the zig-zag path and returns the unmasked data bits. */
function readDataBits(matrix: QrMatrix, mask: number): number[] {
	const size = matrix.size;
	const reserved = functionModules(matrix.version, size);
	const bits: number[] = [];
	for (let right = size - 1; right >= 1; right -= 2) {
		const column = right === 6 ? 5 : right;
		for (let step = 0; step < size; step += 1) {
			const y = ((column + 1) & 2) === 0 ? size - 1 - step : step;
			for (let offset = 0; offset < 2; offset += 1) {
				const x = column - offset;
				if (reserved[y]![x]) {
					continue;
				}
				const dark = matrix.modules[y]![x] === true;
				bits.push(dark !== maskBit(mask, y, x) ? 1 : 0);
			}
		}
	}
	return bits;
}

function toCodewords(bits: readonly number[]): number[] {
	const codewords: number[] = [];
	for (let index = 0; index + 8 <= bits.length; index += 8) {
		let value = 0;
		for (let bit = 0; bit < 8; bit += 1) {
			value = (value << 1) | bits[index + bit]!;
		}
		codewords.push(value);
	}
	return codewords;
}

/** Undoes the block interleave and returns the data codewords in stream order. */
function deinterleave(codewords: readonly number[], spec: SpecVersion): number[] {
	const dataLength = spec.blocks * spec.dataPerBlock;
	const blocks: number[][] = Array.from({ length: spec.blocks }, () => []);
	for (let index = 0; index < spec.dataPerBlock; index += 1) {
		for (let block = 0; block < spec.blocks; block += 1) {
			blocks[block]!.push(codewords[index * spec.blocks + block]!);
		}
	}
	return blocks.flatMap((block) => block.slice(0, spec.dataPerBlock)).slice(0, dataLength);
}

/** Decodes a matrix produced at error-correction M back to its text. */
function decodeQrText(matrix: QrMatrix): string {
	const spec = SPEC_M[matrix.version];
	if (!spec) {
		throw new Error(`the test reader covers versions 1-6, not ${matrix.version}`);
	}
	if (spec.size !== matrix.size) {
		throw new Error(`size mismatch: spec ${spec.size}, matrix ${matrix.size}`);
	}
	const mask = readFormat(matrix.modules, matrix.size);
	const codewords = toCodewords(readDataBits(matrix, mask));
	const data = deinterleave(codewords, spec);
	if (data.length < spec.dataPerBlock) {
		throw new Error("not enough data codewords after de-interleaving");
	}

	let bitCursor = 0;
	const take = (count: number): number => {
		let value = 0;
		for (let index = 0; index < count; index += 1) {
			const byte = data[bitCursor >> 3]!;
			value = (value << 1) | ((byte >> (7 - (bitCursor & 7))) & 1);
			bitCursor += 1;
		}
		return value;
	};

	if (take(4) !== 0b0100) {
		throw new Error("mode indicator is not byte mode");
	}
	const length = take(8);
	const bytes: number[] = [];
	for (let index = 0; index < length; index += 1) {
		bytes.push(take(8));
	}
	return new TextDecoder().decode(Uint8Array.from(bytes));
}

function withFlippedModule(matrix: QrMatrix, y: number, x: number): QrMatrix {
	const modules = matrix.modules.map((row) => [...row]);
	modules[y]![x] = !modules[y]![x]!;
	return { ...matrix, modules };
}

function encodeForTest(text: string): QrMatrix {
	const result = encodeQr(text, "M");
	if (!result.ok) {
		throw new Error(`encoder refused "${text}": ${result.error.message}`);
	}
	return result.value;
}

describe("qr-encode round trip (independent reader)", () => {
	// Versions below are the measured ones, not assumed: the point of the test
	// is the round trip, not the capacity table (qr-encode.test.ts covers that).
	test.each([
		["hi", 1],
		["HELLO WORLD", 1],
		["https://pockettools.app", 2],
		["https://pockettools.app/tools/json-formatter", 4],
		["a".repeat(60), 4],
		["https://example.com/x".repeat(4), 5],
	] as const)("decodes back to the input text: %s", (text, version) => {
		const matrix = encodeForTest(text);
		expect(matrix.version).toBe(version);
		expect(decodeQrText(matrix)).toBe(text);
	});

	test("the reader really reads the matrix, not the input", () => {
		// Guard against a self-fulfilling test: flipping a data module must
		// change what the reader sees. If this ever passes unchanged, the
		// round-trip assertions above prove nothing.
		const matrix = encodeForTest("https://pockettools.app");
		const corrupted = withFlippedModule(matrix, matrix.size - 4, matrix.size - 6);
		expect(decodeQrText(corrupted)).not.toBe("https://pockettools.app");
	});

	test("the placed format information names a real mask", () => {
		for (const text of ["hi", "https://pockettools.app", "a".repeat(60)]) {
			const mask = readFormat(encodeForTest(text).modules, encodeForTest(text).size);
			expect(mask).toBeGreaterThanOrEqual(0);
			expect(mask).toBeLessThanOrEqual(7);
		}
	});

	test("capacity boundary: the last byte that fits still round-trips", () => {
		const limit = maxBytes("M");
		expect(decodeQrText(encodeForTest("z".repeat(limit)))).toBe(`z`.repeat(limit));
	});
});

describe("qr-encode structural invariants", () => {
	const eccCases: readonly QrErrorCorrection[] = ["L", "M"];

	test.each(eccCases)("finder patterns sit in three corners at %s", (ecc) => {
		const result = encodeQr("pockettools", ecc);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(finderAt(result.value.modules, 0, 0).every(Boolean)).toBe(true);
		expect(finderAt(result.value.modules, 0, result.value.size - 7).every(Boolean)).toBe(true);
		expect(finderAt(result.value.modules, result.value.size - 7, 0).every(Boolean)).toBe(true);
	});

	test.each(eccCases)("timing patterns alternate at %s", (ecc) => {
		const result = encodeQr("pockettools", ecc);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		const { modules, size } = result.value;
		for (let i = 8; i < size - 8; i += 1) {
			expect(modules[6]![i]).toBe(i % 2 === 0);
			expect(modules[i]![6]).toBe(i % 2 === 0);
		}
	});
});

function finderAt(modules: readonly (readonly boolean[])[], row: number, col: number): boolean[] {
	const pattern = [
		[true, true, true, true, true, true, true],
		[true, false, false, false, false, false, true],
		[true, false, true, true, true, false, true],
		[true, false, true, true, true, false, true],
		[true, false, true, true, true, false, true],
		[true, false, false, false, false, false, true],
		[true, true, true, true, true, true, true],
	];
	const seen: boolean[] = [];
	for (let r = 0; r < 7; r += 1) {
		for (let c = 0; c < 7; c += 1) {
			seen.push(modules[row + r]?.[col + c] === pattern[r]?.[c]);
		}
	}
	return seen;
}
