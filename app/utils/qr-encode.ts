import type { Result } from "../types/tool";

export type QrErrorCorrection = "L" | "M";

export type QrEncodeErrorCode = "empty_input" | "too_long" | "unsupported_ecc";

export type QrMatrix = Readonly<{
	size: number;
	version: number;
	ecc: QrErrorCorrection;
	modules: readonly (readonly boolean[])[];
}>;

type VersionInfo = Readonly<{
	version: number;
	size: number;
	dataPerBlock: number;
	ecPerBlock: number;
	blocks: number;
	remainder: number;
	align: readonly number[];
}>;

// Byte-mode capacities only (mode + count overhead is 12 bits, so a version
// holds dataPerBlock * blocks - 2 bytes). Versions 1-6 need no version-info
// blocks; longer payloads fail loudly instead of silently degrading.
const VERSIONS: Readonly<Record<QrErrorCorrection, readonly VersionInfo[]>> = {
	L: [
		{ version: 1, size: 21, dataPerBlock: 19, ecPerBlock: 7, blocks: 1, remainder: 0, align: [] },
		{
			version: 2,
			size: 25,
			dataPerBlock: 34,
			ecPerBlock: 10,
			blocks: 1,
			remainder: 7,
			align: [6, 18],
		},
		{
			version: 3,
			size: 29,
			dataPerBlock: 55,
			ecPerBlock: 15,
			blocks: 1,
			remainder: 7,
			align: [6, 22],
		},
		{
			version: 4,
			size: 33,
			dataPerBlock: 80,
			ecPerBlock: 20,
			blocks: 1,
			remainder: 7,
			align: [6, 26],
		},
		{
			version: 5,
			size: 37,
			dataPerBlock: 108,
			ecPerBlock: 26,
			blocks: 1,
			remainder: 7,
			align: [6, 30],
		},
		{
			version: 6,
			size: 41,
			dataPerBlock: 68,
			ecPerBlock: 18,
			blocks: 2,
			remainder: 7,
			align: [6, 34],
		},
	],
	M: [
		{ version: 1, size: 21, dataPerBlock: 16, ecPerBlock: 10, blocks: 1, remainder: 0, align: [] },
		{
			version: 2,
			size: 25,
			dataPerBlock: 28,
			ecPerBlock: 16,
			blocks: 1,
			remainder: 7,
			align: [6, 18],
		},
		{
			version: 3,
			size: 29,
			dataPerBlock: 44,
			ecPerBlock: 26,
			blocks: 1,
			remainder: 7,
			align: [6, 22],
		},
		{
			version: 4,
			size: 33,
			dataPerBlock: 32,
			ecPerBlock: 18,
			blocks: 2,
			remainder: 7,
			align: [6, 26],
		},
		{
			version: 5,
			size: 37,
			dataPerBlock: 43,
			ecPerBlock: 24,
			blocks: 2,
			remainder: 7,
			align: [6, 30],
		},
		{
			version: 6,
			size: 41,
			dataPerBlock: 27,
			ecPerBlock: 16,
			blocks: 4,
			remainder: 7,
			align: [6, 34],
		},
	],
};

const ECC_FORMAT_BITS: Readonly<Record<QrErrorCorrection, number>> = { L: 1, M: 0 };

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

function galoisMultiply(left: number, right: number): number {
	if (left === 0 || right === 0) {
		return 0;
	}
	return EXP_TABLE[LOG_TABLE[left]! + LOG_TABLE[right]!]!;
}

// Generator polynomial of the given degree: product of (x + a^i).
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
	return poly;
}

function rsRemainder(data: readonly number[], degree: number): number[] {
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

function pushBits(target: number[], value: number, length: number): void {
	for (let index = length - 1; index >= 0; index -= 1) {
		target.push((value >>> index) & 1);
	}
}

function maskApplies(mask: number, row: number, col: number): boolean {
	switch (mask) {
		case 0:
			return (row + col) % 2 === 0;
		case 1:
			return row % 2 === 0;
		case 2:
			return col % 3 === 0;
		case 3:
			return (row + col) % 3 === 0;
		case 4:
			return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
		case 5:
			return ((row * col) % 2) + ((row * col) % 3) === 0;
		case 6:
			return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;
		default:
			return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0;
	}
}

function finderDark(dx: number, dy: number): boolean {
	const distance = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
	return distance !== 2;
}

type MutableGrid = boolean[][];

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

function drawMatrix(
	bits: readonly number[],
	info: VersionInfo,
	ecc: QrErrorCorrection,
): { modules: boolean[][] } {
	const size = info.size;
	const modules: MutableGrid = Array.from({ length: size }, () =>
		Array.from({ length: size }, () => false),
	);
	const isFunction: MutableGrid = Array.from({ length: size }, () =>
		Array.from({ length: size }, () => false),
	);

	function set(x: number, y: number, dark: boolean, fn: boolean): void {
		modules[y]![x] = dark;
		if (fn) {
			isFunction[y]![x] = true;
		}
	}

	drawFinder(modules, isFunction, size, 0, 0);
	drawFinder(modules, isFunction, size, size - 7, 0);
	drawFinder(modules, isFunction, size, 0, size - 7);

	for (let index = 0; index < size; index += 1) {
		if (!isFunction[6]![index]) {
			set(index, 6, index % 2 === 0, true);
		}
		if (!isFunction[index]![6]) {
			set(6, index, index % 2 === 0, true);
		}
	}

	drawAlignments(modules, isFunction, info);
	reserveFormat(modules, isFunction, size);

	let bitIndex = 0;
	for (let right = size - 1; right >= 1; right -= 2) {
		const pair = right === 6 ? 5 : right;
		for (let vertical = 0; vertical < size; vertical += 1) {
			for (let j = 0; j < 2; j += 1) {
				const x = pair - j;
				const upward = ((pair + 1) & 2) === 0;
				const y = upward ? size - 1 - vertical : vertical;
				if (!isFunction[y]![x] && bitIndex < bits.length) {
					modules[y]![x] = bits[bitIndex] === 1;
					bitIndex += 1;
				}
			}
		}
	}

	let bestMask = 0;
	let bestPenalty = Number.POSITIVE_INFINITY;
	let bestModules: MutableGrid = modules;
	for (let mask = 0; mask < 8; mask += 1) {
		const trial: MutableGrid = modules.map((row) => [...row]);
		for (let y = 0; y < size; y += 1) {
			for (let x = 0; x < size; x += 1) {
				if (!isFunction[y]![x] && maskApplies(mask, y, x)) {
					trial[y]![x] = !trial[y]![x];
				}
			}
		}
		drawFormat(trial, size, formatBits(ecc, mask));
		const penalty = penaltyScore(trial, size);
		if (penalty < bestPenalty) {
			bestPenalty = penalty;
			bestMask = mask;
			bestModules = trial;
		}
	}
	void bestMask;
	drawFormat(bestModules, size, formatBits(ecc, bestMask));
	return { modules: bestModules };
}

function drawFinder(
	modules: MutableGrid,
	isFunction: MutableGrid,
	size: number,
	cx: number,
	cy: number,
): void {
	for (let dy = -1; dy <= 7; dy += 1) {
		for (let dx = -1; dx <= 7; dx += 1) {
			const x = cx + dx;
			const y = cy + dy;
			if (x < 0 || x >= size || y < 0 || y >= size) {
				continue;
			}
			const inside = dx >= 0 && dx < 7 && dy >= 0 && dy < 7;
			modules[y]![x] = inside ? finderDark(dx, dy) : false;
			isFunction[y]![x] = true;
		}
	}
}

function drawAlignments(modules: MutableGrid, isFunction: MutableGrid, info: VersionInfo): void {
	const pos = info.align;
	for (let i = 0; i < pos.length; i += 1) {
		for (let j = 0; j < pos.length; j += 1) {
			if (
				(i === 0 && j === 0) ||
				(i === 0 && j === pos.length - 1) ||
				(i === pos.length - 1 && j === 0)
			) {
				continue;
			}
			const cx = pos[i]!;
			const cy = pos[j]!;
			for (let dy = -2; dy <= 2; dy += 1) {
				for (let dx = -2; dx <= 2; dx += 1) {
					const distance = Math.max(Math.abs(dx), Math.abs(dy));
					modules[cy + dy]![cx + dx] = distance !== 1;
					isFunction[cy + dy]![cx + dx] = true;
				}
			}
		}
	}
}

function reserveFormat(modules: MutableGrid, isFunction: MutableGrid, size: number): void {
	function reserve(x: number, y: number): void {
		modules[y]![x] = false;
		isFunction[y]![x] = true;
	}
	for (let index = 0; index <= 5; index += 1) {
		reserve(8, index);
	}
	reserve(8, 7);
	reserve(8, 8);
	reserve(7, 8);
	for (let index = 9; index < 15; index += 1) {
		reserve(14 - index, 8);
	}
	for (let index = 0; index < 8; index += 1) {
		reserve(size - 1 - index, 8);
	}
	for (let index = 8; index < 15; index += 1) {
		reserve(8, size - 15 + index);
	}
	reserve(size - 8, 8);
}

function formatBits(ecc: QrErrorCorrection, mask: number): number {
	const data = (ECC_FORMAT_BITS[ecc]! << 3) | mask;
	let remainder = data;
	for (let index = 0; index < 10; index += 1) {
		remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537);
	}
	return ((data << 10) | remainder) ^ 0x5412;
}

function drawFormat(modules: MutableGrid, size: number, bits: number): void {
	function bit(index: number): boolean {
		return ((bits >>> index) & 1) === 1;
	}
	function set(x: number, y: number, dark: boolean): void {
		modules[y]![x] = dark;
	}
	for (let index = 0; index <= 5; index += 1) {
		set(8, index, bit(index));
	}
	set(8, 7, bit(6));
	set(8, 8, bit(7));
	set(7, 8, bit(8));
	for (let index = 9; index < 15; index += 1) {
		set(14 - index, 8, bit(index));
	}
	for (let index = 0; index < 8; index += 1) {
		set(size - 1 - index, 8, bit(index));
	}
	for (let index = 8; index < 15; index += 1) {
		set(8, size - 15 + index, bit(index));
	}
	set(size - 8, 8, true);
}

function penaltyScore(modules: readonly (readonly boolean[])[], size: number): number {
	let penalty = 0;

	for (let y = 0; y < size; y += 1) {
		let runColor = modules[y]![0]!;
		let runLength = 1;
		for (let x = 1; x < size; x += 1) {
			if (modules[y]![x] === runColor) {
				runLength += 1;
			} else {
				if (runLength >= 5) {
					penalty += 3 + (runLength - 5);
				}
				runColor = modules[y]![x]!;
				runLength = 1;
			}
		}
		if (runLength >= 5) {
			penalty += 3 + (runLength - 5);
		}
	}
	for (let x = 0; x < size; x += 1) {
		let runColor = modules[0]![x]!;
		let runLength = 1;
		for (let y = 1; y < size; y += 1) {
			if (modules[y]![x] === runColor) {
				runLength += 1;
			} else {
				if (runLength >= 5) {
					penalty += 3 + (runLength - 5);
				}
				runColor = modules[y]![x]!;
				runLength = 1;
			}
		}
		if (runLength >= 5) {
			penalty += 3 + (runLength - 5);
		}
	}

	for (let y = 0; y < size - 1; y += 1) {
		for (let x = 0; x < size - 1; x += 1) {
			const color = modules[y]![x]!;
			if (
				modules[y]![x + 1] === color &&
				modules[y + 1]![x] === color &&
				modules[y + 1]![x + 1] === color
			) {
				penalty += 3;
			}
		}
	}

	const finderLike = [true, false, true, true, true, false, true, false, false, false, false];
	const finderLikeInverse = [
		false,
		false,
		false,
		false,
		true,
		false,
		true,
		true,
		true,
		false,
		true,
	];
	function matches(line: readonly boolean[], start: number, pattern: readonly boolean[]): boolean {
		for (let index = 0; index < pattern.length; index += 1) {
			if (line[start + index] !== pattern[index]) {
				return false;
			}
		}
		return true;
	}
	for (let y = 0; y < size; y += 1) {
		const row = modules[y]!;
		for (let x = 0; x <= size - 11; x += 1) {
			if (matches(row, x, finderLike) || matches(row, x, finderLikeInverse)) {
				penalty += 40;
			}
		}
	}
	for (let x = 0; x < size; x += 1) {
		for (let y = 0; y <= size - 11; y += 1) {
			let like = true;
			let inverse = true;
			for (let index = 0; index < 11; index += 1) {
				if (modules[y + index]![x] !== finderLike[index]) {
					like = false;
				}
				if (modules[y + index]![x] !== finderLikeInverse[index]) {
					inverse = false;
				}
			}
			if (like || inverse) {
				penalty += 40;
			}
		}
	}

	let dark = 0;
	for (const row of modules) {
		for (const cell of row) {
			if (cell) {
				dark += 1;
			}
		}
	}
	const total = size * size;
	const roundedDown = Math.floor((dark * 20) / total) * 5;
	penalty += (Math.abs(roundedDown - 50) / 5) * 10;

	return penalty;
}
