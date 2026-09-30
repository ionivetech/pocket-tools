import { describe, expect, test } from "bun:test";
import { pushBits, rsRemainder } from "../../app/utils/qr-codec";

/** Independent GF(256) multiply, so the field arithmetic is cross-checked too. */
function gfMultiply(left: number, right: number): number {
	let result = 0;
	let a = left;
	let b = right;
	for (let bit = 0; bit < 8; bit += 1) {
		if ((b & 1) === 1) {
			result ^= a;
		}
		b >>>= 1;
		a <<= 1;
		if (a > 255) {
			a ^= 0x11d;
		}
	}
	return result;
}

/** Evaluates a codeword polynomial at a^exponent; a valid remainder makes this 0. */
function syndrome(codeword: readonly number[], exponent: number): number {
	let root = 1;
	for (let index = 0; index < exponent; index += 1) {
		root = gfMultiply(root, 2);
	}
	let accumulator = 0;
	for (const byte of codeword) {
		accumulator = gfMultiply(accumulator, root) ^ byte;
	}
	return accumulator;
}

const DATA = [
	0x40, 0xd2, 0x75, 0x47, 0x76, 0x17, 0x32, 0x06, 0x27, 0x26, 0x96, 0xc6, 0xc6, 0x96, 0x70, 0xec,
];

describe("qr-codec", () => {
	test.each([10, 16, 18, 26])("returns %i error-correction codewords", (degree) => {
		expect(rsRemainder(DATA, degree)).toHaveLength(degree);
	});

	test("the remainder zeroes every syndrome of the codeword", () => {
		const degree = 10;
		const codeword = [...DATA, ...rsRemainder(DATA, degree)];
		for (let exponent = 0; exponent < degree; exponent += 1) {
			expect(syndrome(codeword, exponent)).toBe(0);
		}
	});

	test("a broken codeword has a non-zero syndrome", () => {
		const codeword = [...DATA, ...rsRemainder(DATA, 10)];
		codeword[3] = codeword[3]! ^ 0x01;
		expect(syndrome(codeword, 0)).not.toBe(0);
	});

	test("changing a data byte changes every codeword", () => {
		const before = rsRemainder(DATA, 10);
		const after = rsRemainder([...DATA.slice(0, 3), DATA[3]! ^ 0x01], 10);
		expect(after).not.toEqual(before);
		expect(after.filter((byte, index) => byte === before[index])).toHaveLength(0);
	});

	test("pushes bits most significant first", () => {
		const bits: number[] = [];
		pushBits(bits, 0b0100, 4);
		expect(bits).toEqual([0, 1, 0, 0]);

		const byte: number[] = [];
		pushBits(byte, 0b10101010, 8);
		expect(byte).toEqual([1, 0, 1, 0, 1, 0, 1, 0]);
	});
});
