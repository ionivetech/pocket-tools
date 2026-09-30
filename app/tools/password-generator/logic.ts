import type { Result } from "../../types/tool";
import { parsePasswordGeneratorInput, type PasswordGeneratorInput } from "./schema";

export type PasswordGeneratorOutput = Readonly<{
	password: string;
	length: number;
	entropyBits: number;
	strength: "weak" | "ok" | "strong";
}>;

const LOWER = "abcdefghijkmnopqrstuvwxyz";
const LOWER_AMBIGUOUS = "l";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const UPPER_AMBIGUOUS = "IO";
const DIGITS = "23456789";
const DIGITS_AMBIGUOUS = "01";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.<>?";
const SYMBOLS_AMBIGUOUS = "|";

function randomIndex(count: number): number {
	const bytes = new Uint8Array(4);
	crypto.getRandomValues(bytes);
	const value = (bytes[0]! << 24) | (bytes[1]! << 16) | (bytes[2]! << 8) | (bytes[3]! >>> 0);
	return Math.abs(value) % count;
}

function shuffled(characters: string[]): string[] {
	const pool = [...characters];
	for (let index = pool.length - 1; index > 0; index -= 1) {
		const other = randomIndex(index + 1);
		[pool[index], pool[other]] = [pool[other]!, pool[index]!];
	}
	return pool;
}

/**
 * Generates a password with the platform random generator. Every selected set
 * contributes at least one character (placed, then shuffled), so representation
 * is structural, not luck. Nothing is stored or shared — the component wires
 * no history and no URL state on purpose.
 *
 * @example
 * ```ts
 * runPasswordGenerator({ length: 16, lower: true, upper: true, digits: true, symbols: false, excludeAmbiguous: true }).value.password.length; // 16
 * ```
 */
export function runPasswordGenerator(
	input: PasswordGeneratorInput,
): Result<PasswordGeneratorOutput> {
	const validated = parsePasswordGeneratorInput(input);
	if (!validated.ok) {
		return validated;
	}
	const { length, lower, upper, digits, symbols, excludeAmbiguous } = validated.value;

	const pools: string[] = [];
	if (lower) {
		pools.push(excludeAmbiguous ? LOWER : LOWER + LOWER_AMBIGUOUS);
	}
	if (upper) {
		pools.push(excludeAmbiguous ? UPPER : UPPER + UPPER_AMBIGUOUS);
	}
	if (digits) {
		pools.push(excludeAmbiguous ? DIGITS : DIGITS + DIGITS_AMBIGUOUS);
	}
	if (symbols) {
		pools.push(excludeAmbiguous ? SYMBOLS : SYMBOLS + SYMBOLS_AMBIGUOUS);
	}
	if (pools.length === 0) {
		return {
			ok: false,
			error: { code: "no_sets", message: "Pick at least one character set." },
		};
	}

	const alphabet = pools.join("");
	const guaranteed = pools.map((pool) => pool[randomIndex(pool.length)]!);
	const rest: string[] = [];
	for (let index = guaranteed.length; index < length; index += 1) {
		rest.push(alphabet[randomIndex(alphabet.length)]!);
	}
	const password = shuffled([...guaranteed, ...rest])
		.slice(0, length)
		.join("");
	const entropyBits = Math.round(length * Math.log2(alphabet.length));
	const strength = entropyBits < 50 ? "weak" : entropyBits <= 80 ? "ok" : "strong";
	return { ok: true, value: { password, length, entropyBits, strength } };
}
