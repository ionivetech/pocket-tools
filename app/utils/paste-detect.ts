export type PasteSuggestion = Readonly<{
	toolSlug: string;
	label: string;
	reason: string;
}>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const BASE64_PATTERN = /^[A-Za-z0-9+/=_-]{24,}={0,2}$/;

function looksLikeJson(text: string): boolean {
	const trimmed = text.trim();
	if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) return false;
	try {
		JSON.parse(trimmed);
		return true;
	} catch {
		// Unquoted paste that still smells like JSON (keys + colons) still suggests the tool.
		return /"[^"]+"\s*:/.test(trimmed);
	}
}

function looksLikeBase64(text: string): boolean {
	const trimmed = text.trim().replace(/\s+/g, "");
	if (trimmed.length < 24 || trimmed.length % 4 !== 0) return false;
	if (!BASE64_PATTERN.test(trimmed)) return false;
	try {
		atob(trimmed);
		return true;
	} catch {
		return false;
	}
}

/**
 * Suggests relevant tools for pasted text. Pure, local-only, never uploads.
 * Returns empty for short/generic text to avoid noisy suggestions.
 *
 * @example
 * ```ts
 * detectPasteTools('{"a":1}'); // [{ toolSlug: "json-formatter", ... }]
 * ```
 */
export function detectPasteTools(text: string): PasteSuggestion[] {
	const trimmed = text.trim();
	if (trimmed.length < 7) return [];

	if (looksLikeJson(trimmed)) {
		return [
			{
				toolSlug: "json-formatter",
				label: "Tidy this with JSON formatter",
				reason: "Looks like JSON data",
			},
		];
	}

	if (UUID_PATTERN.test(trimmed) || ULID_PATTERN.test(trimmed)) {
		return [
			{
				toolSlug: "uuid-generator",
				label: "Compare with UUID generator",
				reason: "Looks like an identifier",
			},
		];
	}

	if (HEX_COLOR_PATTERN.test(trimmed)) {
		return [
			{ toolSlug: "color-picker", label: "Open in color helper", reason: "Looks like a color" },
		];
	}

	if (looksLikeBase64(trimmed)) {
		return [
			{ toolSlug: "base64-tool", label: "Decode with Base64 helper", reason: "Looks encoded" },
		];
	}

	if (trimmed.length > 120 && trimmed.split(/\s+/).length > 12) {
		return [{ toolSlug: "text-cleaner", label: "Clean this text", reason: "Long pasted text" }];
	}

	return [];
}
