import { maskApplies, penaltyScore } from "./qr-penalty";
import type { QrErrorCorrection } from "./qr-codec";

/**
 * QR matrix geometry: the version table, the function patterns, the reserved
 * strips and the zig-zag data placement. Split out of `qr-encode.ts` so that
 * file is only the public API and this one is only the layout.
 */

export type { QrErrorCorrection } from "./qr-codec";

export type VersionInfo = Readonly<{
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
export const VERSIONS: Readonly<Record<QrErrorCorrection, readonly VersionInfo[]>> = {
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

export type MutableGrid = boolean[][];

function finderDark(dx: number, dy: number): boolean {
	const distance = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
	return distance !== 2;
}

export function drawMatrix(
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
	// ISO/IEC 18004 places the 15 format bits MSB first, so the bit written at
	// position `index` is bit (14 - index). Writing bit(index) here (LSB first)
	// mirrors the string, which ships the wrong mask to every scanner; the
	// round-trip reader in tests/unit/qr-round-trip.test.ts is what caught it.
	for (let index = 0; index <= 5; index += 1) {
		set(8, index, bit(14 - index));
	}
	set(8, 7, bit(8));
	set(8, 8, bit(7));
	set(7, 8, bit(6));
	for (let index = 9; index < 15; index += 1) {
		set(14 - index, 8, bit(14 - index));
	}
	for (let index = 0; index < 8; index += 1) {
		set(size - 1 - index, 8, bit(14 - index));
	}
	for (let index = 8; index < 15; index += 1) {
		set(8, size - 15 + index, bit(14 - index));
	}
	set(8, size - 8, true);
}
