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

function sanitizeFilename(filename: string): string | undefined {
	if (typeof filename !== "string") {
		return undefined;
	}

	const basename = filename.replaceAll("\\", "/").split("/").at(-1)?.trim() ?? "";
	const withoutControls = [...basename]
		.filter((character) => {
			const codePoint = character.codePointAt(0) ?? 0;
			return codePoint > 31 && codePoint !== 127;
		})
		.join("");
	const sanitized = withoutControls.replace(/[<>:"|?*]/g, "-").trim();

	if (!sanitized || sanitized === "." || sanitized === "..") {
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

	if (
		typeof Blob === "undefined" ||
		(environment !== undefined &&
			(typeof environment.createObjectURL !== "function" ||
				typeof environment.revokeObjectURL !== "function" ||
				typeof environment.createAnchor !== "function"))
	) {
		throw new BrowserActionError("download_unavailable");
	}

	const downloadEnvironment = environment ?? getDefaultDownloadEnvironment();
	let objectUrl: string | undefined;
	let actionError: BrowserActionError | undefined;

	try {
		const blob = new Blob([value], { type: "text/plain;charset=utf-8" });
		objectUrl = downloadEnvironment.createObjectURL(blob);
		if (typeof objectUrl !== "string" || objectUrl.length === 0) {
			throw new BrowserActionError("download_unavailable");
		}

		const anchor = downloadEnvironment.createAnchor();
		anchor.href = objectUrl;
		anchor.download = safeFilename;
		anchor.type = "text/plain;charset=utf-8";
		anchor.click();
	} catch {
		actionError = new BrowserActionError("download_unavailable");
	} finally {
		if (objectUrl !== undefined) {
			try {
				downloadEnvironment.revokeObjectURL(objectUrl);
			} catch {
				actionError ??= new BrowserActionError("download_unavailable");
			}
		}
	}

	if (actionError) {
		throw actionError;
	}
}
