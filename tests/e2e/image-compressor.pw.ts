import { expect, test } from "@playwright/test";
import {
	expectNoHorizontalOverflow,
	expectNoSeriousAxeViolations,
	expectTouchTargetsAtLeast44,
	gotoAppReady,
	openToolOptions,
} from "./helpers/app";
import { SAMPLE_PNG_BASE64, addImageFile } from "./helpers/image";

test.describe("Image compressor", () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test("asks for a photo before doing anything", async ({ page }) => {
		await gotoAppReady(page, "/tools/image-compressor");
		await expect(page.getByTestId("image-compressor-status")).toContainText(
			"Add a photo to see the smaller file.",
		);
		await expect(page.getByTestId("image-compressor-download")).toBeDisabled();
	});

	test("reports the smaller file after a real upload", async ({ page }) => {
		await gotoAppReady(page, "/tools/image-compressor");
		await addImageFile(page, "photo.png", SAMPLE_PNG_BASE64);
		await expect(page.getByTestId("image-compressor-stats")).toBeVisible();
		await expect(page.getByTestId("image-compressor-preview")).toBeVisible();
		await expect(page.getByTestId("image-compressor-download")).toBeEnabled();
	});

	test("has no serious axe violations and keeps touch targets at 44px", async ({ page }) => {
		await gotoAppReady(page, "/tools/image-compressor");
		await openToolOptions(page);
		await expectNoSeriousAxeViolations(page);
		await expectTouchTargetsAtLeast44(page);
		await expectNoHorizontalOverflow(page, "375px image-compressor");
	});
});
