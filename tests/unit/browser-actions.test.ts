import { describe, expect, test } from "bun:test";
import {
	BrowserActionError,
	copyText,
	downloadText,
	type BrowserActionErrorCode,
	type DownloadEnvironment,
} from "../../app/utils/browser-actions";

function expectActionError(error: unknown, code: BrowserActionErrorCode): void {
	expect(error).toBeInstanceOf(BrowserActionError);
	if (!(error instanceof BrowserActionError)) {
		throw new Error(`Expected ${code}`);
	}

	expect(error.code).toBe(code);
	expect(error.message).not.toContain("private value");
}

function createDownloadEnvironment(overrides: Partial<DownloadEnvironment> = {}) {
	const blobs: Blob[] = [];
	const revoked: string[] = [];
	let clicked = false;
	const anchor = {
		href: "",
		download: "",
		type: "",
		click: () => {
			clicked = true;
		},
	};
	const environment: DownloadEnvironment = {
		createObjectURL(blob) {
			blobs.push(blob);
			return "blob:test";
		},
		revokeObjectURL(url) {
			revoked.push(url);
		},
		createAnchor: () => anchor,
		...overrides,
	};

	return {
		anchor,
		blobs,
		environment,
		revoked,
		wasClicked: () => clicked,
	};
}

describe("browser actions", () => {
	test("copies text through the supplied clipboard", async () => {
		const writes: string[] = [];

		await copyText("hello", {
			writeText: async (value) => {
				writes.push(value);
			},
		});

		expect(writes).toEqual(["hello"]);
	});

	test("normalizes a rejected clipboard without exposing the value", async () => {
		try {
			await copyText("private value", {
				writeText: async () => {
					throw new Error("private value");
				},
			});
		} catch (error) {
			expectActionError(error, "clipboard_unavailable");
			return;
		}

		throw new Error("Expected clipboard rejection");
	});

	test("reports an unavailable clipboard", async () => {
		try {
			await copyText("hello", undefined);
		} catch (error) {
			expectActionError(error, "clipboard_unavailable");
			return;
		}

		throw new Error("Expected unavailable clipboard");
	});

	test("rejects a filename without a safe basename", () => {
		const result = createDownloadEnvironment();

		try {
			downloadText("private value", "../", result.environment);
		} catch (error) {
			expectActionError(error, "invalid_filename");
			expect(result.blobs).toHaveLength(0);
			return;
		}

		throw new Error("Expected invalid filename");
	});

	test("downloads sanitized text and revokes the object URL", async () => {
		const result = createDownloadEnvironment();

		downloadText("hello", "../reports/report.txt", result.environment);

		expect(result.anchor.download).toBe("report.txt");
		expect(result.anchor.href).toBe("blob:test");
		expect(result.anchor.type).toBe("text/plain;charset=utf-8");
		expect(result.wasClicked()).toBe(true);
		expect(await result.blobs[0]?.text()).toBe("hello");
		expect(result.revoked).toEqual(["blob:test"]);
	});

	test("drops invisible format characters that can disguise an extension", () => {
		const result = createDownloadEnvironment();

		downloadText("hello", "invoice\u202Etxt.exe", result.environment);

		expect(result.anchor.download).toBe("invoicetxt.exe");
	});

	test("neutralises directional isolates and a byte-order mark", () => {
		for (const [filename, expected] of [
			["report\u2066name.txt", "reportname.txt"],
			["summary\uFEFF.txt", "summary.txt"],
			["\u200Eleft\u200F.txt", "left.txt"],
		] as const) {
			const result = createDownloadEnvironment();

			downloadText("hello", filename, result.environment);

			expect(result.anchor.download).toBe(expected);
		}
	});

	test("rejects Windows reserved device names before creating a download", () => {
		for (const filename of ["CON", "con.txt", "NUL", "COM1.log", "LPT9", "lpt1.TXT"]) {
			const result = createDownloadEnvironment();

			try {
				downloadText("private value", filename, result.environment);
			} catch (error) {
				expectActionError(error, "invalid_filename");
				// Rejected before any object URL exists, so none is created to release.
				expect(result.blobs).toHaveLength(0);
				expect(result.revoked).toEqual([]);
				expect(result.wasClicked()).toBe(false);
				continue;
			}

			throw new Error(`Expected ${filename} to be rejected`);
		}
	});

	test("rejects a dotfile download name", () => {
		for (const filename of [".bashrc", ".env", ".gitignore", "../.bashrc", ".", ".."]) {
			const result = createDownloadEnvironment();

			try {
				downloadText("private value", filename, result.environment);
			} catch (error) {
				expectActionError(error, "invalid_filename");
				expect(result.blobs).toHaveLength(0);
				expect(result.revoked).toEqual([]);
				expect(result.wasClicked()).toBe(false);
				continue;
			}

			throw new Error(`Expected ${filename} to be rejected`);
		}
	});

	test("keeps non-Latin filenames intact", () => {
		for (const filename of ["café.txt", "简历.pdf"]) {
			const result = createDownloadEnvironment();

			downloadText("hello", filename, result.environment);

			expect(result.anchor.download).toBe(filename);
			expect(result.revoked).toEqual(["blob:test"]);
		}
	});

	test("keeps zero-width joiners, which are ordinary letters in Persian, Indic and emoji", () => {
		// U+200C ZWNJ and U+200D ZWJ are \p{Cf}, but mangling them silently renames a
		// legitimate file rather than refusing a hostile one.
		for (const filename of ["می\u200cرام.txt", "नमस्ते\u200d.pdf", "family\u200Dphoto.png"]) {
			const result = createDownloadEnvironment();

			downloadText("hello", filename, result.environment);

			expect(result.anchor.download).toBe(filename);
		}
	});

	test("still strips the whole bidi range, a zero-width no-break space and a soft hyphen", () => {
		for (const [filename, expected] of [
			["invoice\u202Etxt.exe", "invoicetxt.exe"],
			["\u202Aleft\u202B.txt", "left.txt"],
			["\u202Cend\u202D.txt", "end.txt"],
			["\u202Ename\u202E.txt", "name.txt"],
			["\u2066name\u2069.txt", "name.txt"],
			["left\u200F.txt", "left.txt"],
			["soft\u00ADhyphen.txt", "softhyphen.txt"],
			["zero\uFEFFwidth.txt", "zerowidth.txt"],
		] as const) {
			const result = createDownloadEnvironment();

			downloadText("hello", filename, result.environment);

			expect(result.anchor.download).toBe(expected);
		}
	});

	test("strips a trailing dot, which Windows silently drops and can collide on", () => {
		for (const [filename, expected] of [
			["report.txt.", "report.txt"],
			["report.txt..", "report.txt"],
			["report.txt. ", "report.txt"],
			["report.txt . .", "report.txt"],
			["no-extension.", "no-extension"],
		] as const) {
			const result = createDownloadEnvironment();

			downloadText("hello", filename, result.environment);

			expect(result.anchor.download).toBe(expected);
		}
	});

	test("rejects a name that is nothing but dots and spaces", () => {
		for (const filename of ["...", ". . .", " .. "]) {
			const result = createDownloadEnvironment();

			try {
				downloadText("private value", filename, result.environment);
			} catch (error) {
				expectActionError(error, "invalid_filename");
				expect(result.blobs).toHaveLength(0);
				expect(result.wasClicked()).toBe(false);
				continue;
			}

			throw new Error(`Expected ${filename} to be rejected`);
		}
	});

	test("normalizes download failures and still cleans up", () => {
		const result = createDownloadEnvironment();
		result.anchor.click = () => {
			throw new Error("private value");
		};

		try {
			downloadText("private value", "report.txt", result.environment);
		} catch (error) {
			expectActionError(error, "download_unavailable");
			expect(result.revoked).toEqual(["blob:test"]);
			return;
		}

		throw new Error("Expected download failure");
	});
});
