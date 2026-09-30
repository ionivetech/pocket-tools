import { expect, test } from "@playwright/test";
import {
	expectNoHorizontalOverflow,
	expectNoSeriousAxeViolations,
	expectTouchTargetsAtLeast44,
	gotoAppReady,
	openToolOptions,
} from "./helpers/app";
import { SAMPLE_PNG_BASE64, addImageFile } from "./helpers/image";

test.describe("Image resizer", () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test("resizes a real upload and keeps proportions", async ({ page }) => {
		await gotoAppReady(page, "/tools/image-resizer");
		await addImageFile(page, "photo.png", SAMPLE_PNG_BASE64);
		await expect(page.getByTestId("image-resizer-stats")).toContainText("4 × 2 px");
		await expect(page.getByTestId("image-resizer-status")).toContainText("1200 × 600 px");
		await expect(page.getByTestId("image-resizer-preview")).toBeVisible();
	});

	test("asks for a photo before doing anything", async ({ page }) => {
		await gotoAppReady(page, "/tools/image-resizer");
		await expect(page.getByTestId("image-resizer-download")).toBeDisabled();
	});

	test("has no serious axe violations and keeps touch targets at 44px", async ({ page }) => {
		await gotoAppReady(page, "/tools/image-resizer");
		await openToolOptions(page);
		await expectNoSeriousAxeViolations(page);
		await expectTouchTargetsAtLeast44(page);
		await expectNoHorizontalOverflow(page, "375px image-resizer");
	});
});
