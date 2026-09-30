import type { Page } from "@playwright/test";

/** A real 4×2 PNG (brand blue), so canvas work is exercised, not stubbed. */
export const SAMPLE_PNG_BASE64 =
	"iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAIAAADwyuo0AAAAEElEQVR4nGOQ9bsBRwzIHAB9egoZes5f5gAAAABJRU5ErkJggg==";

/**
 * Hands a real image file to the shared `ToolFileDrop` input.
 *
 * @example `await addImageFile(page, "photo.png", SAMPLE_PNG_BASE64);`
 */
export async function addImageFile(page: Page, name: string, base64: string): Promise<void> {
	await page.getByTestId("tool-file-input").setInputFiles({
		name,
		mimeType: "image/png",
		buffer: Buffer.from(base64, "base64"),
	});
}
