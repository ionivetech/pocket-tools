export type BrowserActionErrorCode =
	| "clipboard_unavailable"
	| "download_unavailable"
	| "invalid_filename";

const browserActionErrorMessages: Record<BrowserActionErrorCode, string> = {
	clipboard_unavailable: "Clipboard access is unavailable.",
	download_unavailable: "Download is unavailable in this browser.",
	invalid_filename: "Choose a valid filename.",
};

/** A stable, user-safe error for browser action failures. */
export class BrowserActionError extends Error {
	readonly code: BrowserActionErrorCode;

	constructor(code: BrowserActionErrorCode) {
		super(browserActionErrorMessages[code]);
		this.name = "BrowserActionError";
		this.code = code;
	}
}

export interface DownloadAnchor {
	href: string;
	download: string;
	type: string;
	click: () => void;
}

export interface DownloadEnvironment {
	createObjectURL: (blob: Blob) => string;
	revokeObjectURL: (url: string) => void;
	createAnchor: () => DownloadAnchor;
}

function getDefaultDownloadEnvironment(): DownloadEnvironment {
	if (
		typeof document === "undefined" ||
		typeof Blob === "undefined" ||
		typeof globalThis.URL?.createObjectURL !== "function" ||
		typeof globalThis.URL?.revokeObjectURL !== "function"
	) {
		throw new BrowserActionError("download_unavailable");
	}

	const url = globalThis.URL;
	return {
		createObjectURL: (blob) => url.createObjectURL(blob),
		revokeObjectURL: (objectUrl) => url.revokeObjectURL(objectUrl),
		createAnchor: () => document.createElement("a"),
	};
}

/**
 * Windows resolves these stems to a device, not a file, whatever follows the
 * first dot. Matched case-insensitively on the stem, so `con.txt` is refused too.
 */
const reservedDeviceStems = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

function isReservedDeviceName(filename: string): boolean {
	return reservedDeviceStems.test(filename.split(".")[0] ?? "");
}

function sanitizeFilename(filename: string): string | undefined {
	if (typeof filename !== "string") {
		return undefined;
	}

	const basename = filename.replaceAll("\\", "/").split("/").at(-1)?.trim() ?? "";
	const withoutControls = [...basename]
		.filter((character) => {
			const codePoint = character.codePointAt(0) ?? 0;
			// \p{Cf} drops invisible format characters such as U+202E RIGHT-TO-LEFT
			// OVERRIDE, which otherwise disguise the extension in a file manager.
			// A category filter keeps `café.txt` and `简历.pdf` intact.
			return codePoint > 31 && codePoint !== 127 && !/\p{Cf}/u.test(character);
		})
		.join("");
	const sanitized = withoutControls.replace(/[<>:"|?*]/g, "-").trim();

	if (!sanitized || sanitized === "." || sanitized === ".." || isReservedDeviceName(sanitized)) {
		return undefined;
	}

	return sanitized;
}

/**
 * Copies text through the supplied clipboard adapter.
 *
 * @example
 * ```ts
 * const clipboard = { writeText: async () => {} };
 * await copyText("hello", clipboard);
 * ```
 */
export async function copyText(
	value: string,
	clipboard: Pick<Clipboard, "writeText"> | null | undefined,
): Promise<void> {
	try {
		if (!clipboard || typeof clipboard.writeText !== "function") {
			throw new BrowserActionError("clipboard_unavailable");
		}

		await clipboard.writeText(value);
	} catch {
		throw new BrowserActionError("clipboard_unavailable");
	}
}

/** Rejects a runtime that cannot produce a text Blob or a usable adapter. */
function assertDownloadEnvironment(environment: DownloadEnvironment | undefined): void {
	if (typeof Blob === "undefined") {
		throw new BrowserActionError("download_unavailable");
	}

	if (
		environment !== undefined &&
		(typeof environment.createObjectURL !== "function" ||
			typeof environment.revokeObjectURL !== "function" ||
			typeof environment.createAnchor !== "function")
	) {
		throw new BrowserActionError("download_unavailable");
	}
}

/** Hands the text Blob to the adapter; the caller validates the URL it returns. */
function createTextBlobUrl(environment: DownloadEnvironment, value: string): string {
	return environment.createObjectURL(new Blob([value], { type: "text/plain;charset=utf-8" }));
}

/** Rejects an object URL a lying adapter returned, including an empty one. */
function assertObjectUrl(objectUrl: unknown): void {
	if (typeof objectUrl === "string" && objectUrl.length > 0) {
		return;
	}

	throw new BrowserActionError("download_unavailable");
}

/** Points a fresh anchor at the object URL and triggers the browser download. */
function clickDownloadAnchor(
	environment: DownloadEnvironment,
	objectUrl: string,
	safeFilename: string,
): void {
	const anchor = environment.createAnchor();
	anchor.href = objectUrl;
	anchor.download = safeFilename;
	anchor.type = "text/plain;charset=utf-8";
	anchor.click();
}

/** Releases the object URL in `finally`, reporting a revoke failure instead of hiding it. */
function revokeObjectUrl(
	environment: DownloadEnvironment,
	objectUrl: string | undefined,
): BrowserActionError | undefined {
	if (objectUrl === undefined) {
		return undefined;
	}

	try {
		environment.revokeObjectURL(objectUrl);
		return undefined;
	} catch {
		return new BrowserActionError("download_unavailable");
	}
}

/**
 * Downloads text as a plain-text file and releases its object URL.
 *
 * @example
 * ```ts
 * downloadText("hello", "notes.txt");
 * ```
 */
export function downloadText(
	value: string,
	filename: string,
	environment?: DownloadEnvironment,
): void {
	const safeFilename = sanitizeFilename(filename);
	if (!safeFilename) {
		throw new BrowserActionError("invalid_filename");
	}

	assertDownloadEnvironment(environment);
	const downloadEnvironment = environment ?? getDefaultDownloadEnvironment();
	let objectUrl: string | undefined;
	let actionError: BrowserActionError | undefined;

	try {
		// Created before it is validated so `finally` still revokes a bad URL.
		objectUrl = createTextBlobUrl(downloadEnvironment, value);
		assertObjectUrl(objectUrl);
		clickDownloadAnchor(downloadEnvironment, objectUrl, safeFilename);
	} catch {
		actionError = new BrowserActionError("download_unavailable");
	} finally {
		// Revoke unconditionally; a download failure must not skip cleanup.
		const revokeError = revokeObjectUrl(downloadEnvironment, objectUrl);
		actionError ??= revokeError;
	}

	if (actionError) {
		throw actionError;
	}
}
