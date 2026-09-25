const PREFIX = "v1.";

export const URL_STATE_MAX_BYTES = 4096;

export type UrlState = Readonly<Record<string, string | number | boolean | null>>;

type UrlStateErrorCode = "url_state_invalid" | "url_state_too_large" | "url_state_decode_failed";

export type UrlStateResult<T> =
	| { readonly ok: true; readonly value: T }
	| {
			readonly ok: false;
			readonly error: {
				readonly code: UrlStateErrorCode;
				readonly message: string;
			};
	  };

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

const isUrlStateValue = (value: unknown): value is UrlState[string] =>
	value === null ||
	typeof value === "string" ||
	typeof value === "boolean" ||
	(typeof value === "number" && Number.isFinite(value));

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return false;
	}

	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
};

const isUrlState = (value: unknown): value is UrlState =>
	isPlainObject(value) && Object.values(value).every(isUrlStateValue);

const failure = <T>(code: UrlStateErrorCode, message: string): UrlStateResult<T> => ({
	ok: false,
	error: { code, message },
});

const toBase64Url = (bytes: Uint8Array): string => {
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}

	return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
};

const fromBase64Url = (value: string): Uint8Array | null => {
	if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length % 4 === 1) {
		return null;
	}

	const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
	const padding = (4 - (base64.length % 4)) % 4;

	try {
		const binary = atob(`${base64}${"=".repeat(padding)}`);
		const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
		return toBase64Url(bytes) === value ? bytes : null;
	} catch {
		return null;
	}
};

/**
 * Encodes flat primitive state as deterministic, versioned base64url JSON.
 *
 * @example
 * encodeUrlState({ text: "héllo", count: 2 });
 */
export function encodeUrlState(state: UrlState = {}): UrlStateResult<string> {
	try {
		if (!isPlainObject(state)) {
			return failure("url_state_invalid", "URL state must be a plain object.");
		}

		const entries = Object.entries(state as Record<string, unknown>).sort(([left], [right]) =>
			left < right ? -1 : left > right ? 1 : 0,
		);
		if (!entries.every(([, value]) => isUrlStateValue(value))) {
			return failure(
				"url_state_invalid",
				"URL state values must be strings, finite numbers, booleans, or null.",
			);
		}

		const json = `{${entries
			.map(([key, value]) => `${JSON.stringify(key)}:${JSON.stringify(value)}`)
			.join(",")}}`;
		const value = `${PREFIX}${toBase64Url(encoder.encode(json))}`;

		if (encoder.encode(value).byteLength > URL_STATE_MAX_BYTES) {
			return failure(
				"url_state_too_large",
				`URL state must not exceed ${URL_STATE_MAX_BYTES} bytes.`,
			);
		}

		return { ok: true, value };
	} catch {
		return failure("url_state_invalid", "URL state could not be encoded.");
	}
}

/**
 * Decodes and validates versioned base64url JSON without external side effects.
 *
 * @example
 * decodeUrlState("v1.eyJ0ZXh0IjoiaMOpbGxvIn0");
 */
export function decodeUrlState(value: string | null | undefined): UrlStateResult<UrlState> {
	if (value === null || value === undefined || value === "") {
		return { ok: true, value: {} };
	}

	if (encoder.encode(value).byteLength > URL_STATE_MAX_BYTES) {
		return failure(
			"url_state_too_large",
			`URL state must not exceed ${URL_STATE_MAX_BYTES} bytes.`,
		);
	}

	if (!value.startsWith(PREFIX)) {
		return failure("url_state_decode_failed", "URL state version is invalid.");
	}

	try {
		const bytes = fromBase64Url(value.slice(PREFIX.length));
		if (bytes === null) {
			return failure("url_state_decode_failed", "URL state encoding is invalid.");
		}

		const state: unknown = JSON.parse(decoder.decode(bytes));
		if (!isUrlState(state)) {
			return failure("url_state_decode_failed", "URL state shape is invalid.");
		}

		return { ok: true, value: state };
	} catch {
		return failure("url_state_decode_failed", "URL state could not be decoded.");
	}
}
