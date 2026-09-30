import type { Result } from "../../types/tool";
import { parseColorPickerInput, type ColorPickerInput } from "./schema";

export type Rgb = Readonly<{ r: number; g: number; b: number }>;

export type ColorPickerOutput = Readonly<{
	hex: string;
	rgb: string;
	hsl: string;
	contrastWhite: number;
	contrastBlack: number;
	readableOn: "white" | "black";
}>;

function parseHex(text: string): Rgb | null {
	const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text.trim());
	if (!match) {
		return null;
	}
	const digits = match[1]!;
	const full =
		digits.length === 3
			? digits
					.split("")
					.map((char) => char + char)
					.join("")
			: digits;
	return {
		r: Number.parseInt(full.slice(0, 2), 16),
		g: Number.parseInt(full.slice(2, 4), 16),
		b: Number.parseInt(full.slice(4, 6), 16),
	};
}

function parseRgbFunction(text: string): Rgb | null {
	const match = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i.exec(text.trim());
	if (!match) {
		return null;
	}
	const [r = 0, g = 0, b = 0] = match.slice(1, 4).map(Number);
	if ([r, g, b].some((value) => value < 0 || value > 255)) {
		return null;
	}
	return { r, g, b };
}

function parseHslFunction(text: string): Rgb | null {
	const match = /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/i.exec(text.trim());
	if (!match) {
		return null;
	}
	const h = Number(match[1]) % 360;
	const s = Number(match[2])! / 100;
	const l = Number(match[3])! / 100;
	if (s > 1 || l > 1) {
		return null;
	}
	const chroma = (1 - Math.abs(2 * l - 1)) * s;
	const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
	const [r1, g1, b1] =
		h < 60
			? [chroma, x, 0]
			: h < 120
				? [x, chroma, 0]
				: h < 180
					? [0, chroma, x]
					: h < 240
						? [0, x, chroma]
						: h < 300
							? [x, 0, chroma]
							: [chroma, 0, x];
	const lift = l - chroma / 2;
	const toByte = (value: number): number => Math.round((value + lift) * 255);
	return { r: toByte(r1!), g: toByte(g1!), b: toByte(b1!) };
}

function toHex({ r, g, b }: Rgb): string {
	const byte = (value: number): string => value.toString(16).padStart(2, "0");
	return `#${byte(r)}${byte(g)}${byte(b)}`.toLowerCase();
}

function toHsl({ r, g, b }: Rgb): string {
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const light = (max + min) / 2;
	const delta = max - min;
	const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * light - 1));
	let hue = 0;
	if (delta !== 0) {
		if (max === rn) {
			hue = ((gn - bn) / delta) % 6;
		} else if (max === gn) {
			hue = (bn - rn) / delta + 2;
		} else {
			hue = (rn - gn) / delta + 4;
		}
		hue *= 60;
		if (hue < 0) {
			hue += 360;
		}
	}
	return `hsl(${Math.round(hue)}, ${Math.round(saturation * 100)}%, ${Math.round(light * 100)}%)`;
}

function luminance({ r, g, b }: Rgb): number {
	const channel = (value: number): number => {
		const linear = value / 255;
		return linear <= 0.03928 ? linear / 12.92 : ((linear + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(first: number, second: number): number {
	const [lighter, darker] = first >= second ? [first, second] : [second, first];
	return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

/**
 * Converts a color between HEX, RGB and HSL and reports WCAG contrast
 * against white and black, so the UI can suggest readable text on it.
 *
 * @example
 * ```ts
 * runColorPicker({ color: "#ffffff" }).value.rgb; // "rgb(255, 255, 255)"
 * runColorPicker({ color: "nope" }).error.code; // "invalid_color"
 * ```
 */
export function runColorPicker(input: ColorPickerInput): Result<ColorPickerOutput> {
	const validated = parseColorPickerInput(input);
	if (!validated.ok) {
		return validated;
	}
	const text = validated.value.color.trim();
	if (text === "") {
		return {
			ok: false,
			error: { code: "empty_input", message: "Type a color first, like #1d4ed8." },
		};
	}
	const rgb = parseHex(text) ?? parseRgbFunction(text) ?? parseHslFunction(text);
	if (!rgb) {
		return {
			ok: false,
			error: {
				code: "invalid_color",
				message: "Use HEX (#1d4ed8), rgb(29, 78, 216) or hsl(221, 83%, 45%).",
			},
		};
	}
	const glow = luminance(rgb);
	const contrastWhite = contrast(glow, 1);
	const contrastBlack = contrast(glow, 0);
	return {
		ok: true,
		value: {
			hex: toHex(rgb),
			rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
			hsl: toHsl(rgb),
			contrastWhite,
			contrastBlack,
			readableOn: contrastWhite >= contrastBlack ? "white" : "black",
		},
	};
}
