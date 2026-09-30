import type { Result } from "../types/tool";

export type UnitCategory = "length" | "mass" | "temperature" | "volume" | "speed" | "data";

export type ConvertUnitsErrorCode = "invalid_amount" | "unknown_unit" | "incompatible_units";

type LinearUnit = Readonly<{ unit: string; label: string; toBase: number }>;

const LENGTH: readonly LinearUnit[] = [
	{ unit: "mm", label: "Millimeters (mm)", toBase: 0.001 },
	{ unit: "cm", label: "Centimeters (cm)", toBase: 0.01 },
	{ unit: "m", label: "Meters (m)", toBase: 1 },
	{ unit: "km", label: "Kilometers (km)", toBase: 1000 },
	{ unit: "in", label: "Inches (in)", toBase: 0.0254 },
	{ unit: "ft", label: "Feet (ft)", toBase: 0.3048 },
	{ unit: "yd", label: "Yards (yd)", toBase: 0.9144 },
	{ unit: "mi", label: "Miles (mi)", toBase: 1609.344 },
];

const MASS: readonly LinearUnit[] = [
	{ unit: "mg", label: "Milligrams (mg)", toBase: 0.000001 },
	{ unit: "g", label: "Grams (g)", toBase: 0.001 },
	{ unit: "kg", label: "Kilograms (kg)", toBase: 1 },
	{ unit: "t", label: "Tonnes (t)", toBase: 1000 },
	{ unit: "oz", label: "Ounces (oz)", toBase: 0.028349523125 },
	{ unit: "lb", label: "Pounds (lb)", toBase: 0.45359237 },
];

const VOLUME: readonly LinearUnit[] = [
	{ unit: "ml", label: "Milliliters (ml)", toBase: 0.001 },
	{ unit: "l", label: "Liters (l)", toBase: 1 },
	{ unit: "m3", label: "Cubic meters (m³)", toBase: 1000 },
	{ unit: "floz", label: "Fluid ounces (fl oz)", toBase: 0.0295735 },
	{ unit: "cup", label: "Cups", toBase: 0.236588 },
	{ unit: "gal", label: "Gallons (gal)", toBase: 3.78541 },
];

const SPEED: readonly LinearUnit[] = [
	{ unit: "ms", label: "Meters per second (m/s)", toBase: 1 },
	{ unit: "kmh", label: "Kilometers per hour (km/h)", toBase: 1 / 3.6 },
	{ unit: "mph", label: "Miles per hour (mph)", toBase: 0.44704 },
	{ unit: "knot", label: "Knots (kn)", toBase: 0.514444 },
];

const DATA: readonly LinearUnit[] = [
	{ unit: "bit", label: "Bits (bit)", toBase: 0.125 },
	{ unit: "B", label: "Bytes (B)", toBase: 1 },
	{ unit: "KB", label: "Kilobytes (KB)", toBase: 1024 },
	{ unit: "MB", label: "Megabytes (MB)", toBase: 1024 ** 2 },
	{ unit: "GB", label: "Gigabytes (GB)", toBase: 1024 ** 3 },
	{ unit: "TB", label: "Terabytes (TB)", toBase: 1024 ** 4 },
];

const TEMPERATURE_UNITS = ["C", "F", "K"] as const;

type TemperatureUnit = (typeof TEMPERATURE_UNITS)[number];

const TEMPERATURE_LABELS: Readonly<Record<TemperatureUnit, string>> = {
	C: "Celsius (°C)",
	F: "Fahrenheit (°F)",
	K: "Kelvin (K)",
};

const LINEAR_TABLES: Readonly<Record<Exclude<UnitCategory, "temperature">, readonly LinearUnit[]>> =
	{
		length: LENGTH,
		mass: MASS,
		volume: VOLUME,
		speed: SPEED,
		data: DATA,
	};

function findLinear(unit: string): { category: UnitCategory; entry: LinearUnit } | null {
	for (const category of Object.keys(LINEAR_TABLES) as UnitCategory[]) {
		const entry = LINEAR_TABLES[category as Exclude<UnitCategory, "temperature">].find(
			(candidate) => candidate.unit === unit,
		);
		if (entry) {
			return { category, entry };
		}
	}
	return null;
}

function toCelsius(value: number, from: TemperatureUnit): number {
	if (from === "C") return value;
	if (from === "F") return ((value - 32) * 5) / 9;
	return value - 273.15;
}

function fromCelsius(value: number, to: TemperatureUnit): number {
	if (to === "C") return value;
	if (to === "F") return (value * 9) / 5 + 32;
	return value + 273.15;
}

/**
 * Lists every convertible unit category, for building the UI pickers.
 *
 * @example
 * ```ts
 * listUnitCategories(); // ["length", "mass", "temperature", "volume", "speed", "data"]
 * ```
 */
export function listUnitCategories(): UnitCategory[] {
	return ["length", "mass", "temperature", "volume", "speed", "data"];
}

/**
 * Lists the units of one category with human labels for picker options.
 *
 * @example
 * ```ts
 * listUnits("length")[0]; // { unit: "mm", label: "Millimeters (mm)" }
 * ```
 */
export function listUnits(category: UnitCategory): { unit: string; label: string }[] {
	if (category === "temperature") {
		return TEMPERATURE_UNITS.map((unit) => ({ unit, label: TEMPERATURE_LABELS[unit] }));
	}
	return LINEAR_TABLES[category].map(({ unit, label }) => ({ unit, label }));
}

export type ConvertedAmount = Readonly<{ value: number; category: UnitCategory }>;

/**
 * Converts an amount between two units of the same category. Temperature uses
 * offsets (not factors); everything else converts through its base unit.
 * Results are rounded to 12 significant digits so `0.1 + 0.2`-style float
 * dust never reaches the UI.
 *
 * @example
 * ```ts
 * convertUnits(1, "km", "m"); // { ok: true, value: { value: 1000, category: "length" } }
 * convertUnits(1, "km", "kg").error.code; // "incompatible_units"
 * ```
 */
export function convertUnits(amount: number, from: string, to: string): Result<ConvertedAmount> {
	if (typeof amount !== "number" || !Number.isFinite(amount)) {
		return {
			ok: false,
			error: { code: "invalid_amount", message: "Enter a finite number to convert." },
		};
	}

	const fromTemp = (TEMPERATURE_UNITS as readonly string[]).includes(from);
	const toTemp = (TEMPERATURE_UNITS as readonly string[]).includes(to);
	if (fromTemp || toTemp) {
		if (!fromTemp || !toTemp) {
			return {
				ok: false,
				error: {
					code: "incompatible_units",
					message: "Temperature only converts to temperature.",
				},
			};
		}
		const value = Number(
			fromCelsius(toCelsius(amount, from as TemperatureUnit), to as TemperatureUnit).toPrecision(
				12,
			),
		);
		return { ok: true, value: { value, category: "temperature" } };
	}

	const fromFound = findLinear(from);
	const toFound = findLinear(to);
	if (!fromFound || !toFound) {
		const unknown = !fromFound ? from : to;
		return {
			ok: false,
			error: { code: "unknown_unit", message: `Unknown unit: ${unknown}.` },
		};
	}
	if (fromFound.category !== toFound.category) {
		return {
			ok: false,
			error: {
				code: "incompatible_units",
				message: `${from} is ${fromFound.category}, ${to} is ${toFound.category}. Convert within one group.`,
			},
		};
	}
	const value = Number(((amount * fromFound.entry.toBase) / toFound.entry.toBase).toPrecision(12));
	return { ok: true, value: { value, category: fromFound.category } };
}
