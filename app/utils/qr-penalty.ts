/**
 * Mask selection helpers for the QR writer: the eight mask patterns and the four
 * penalty rules from ISO/IEC 18004 that pick the least visually confusing one.
 */

/** Whether the given mask flips the module at (row, col). */
export function maskApplies(mask: number, row: number, col: number): boolean {
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

export function penaltyScore(modules: readonly (readonly boolean[])[], size: number): number {
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
