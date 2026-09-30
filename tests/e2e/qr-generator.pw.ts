import { expect, test } from "@playwright/test";
import {
	expectNoHorizontalOverflow,
	expectNoSeriousAxeViolations,
	expectTouchTargetsAtLeast44,
	gotoAppReady,
	openToolOptions,
} from "./helpers/app";

test.describe("QR generator", () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test("renders a code for the default link", async ({ page }) => {
		await gotoAppReady(page, "/tools/qr-generator");
		const canvas = page.getByTestId("qr-generator-canvas");
		await expect(canvas).toBeVisible();
		await expect(page.getByTestId("qr-generator-status")).toContainText("error correction M");
		expect(
			await canvas.evaluate((element) => (element as HTMLCanvasElement).width),
		).toBeGreaterThan(100);
	});

	test("offers the one verified error-correction level", async ({ page }) => {
		await gotoAppReady(page, "/tools/qr-generator");
		await openToolOptions(page);
		await page.getByTestId("qr-generator-ecc").click();
		await expect(page.getByRole("option")).toHaveCount(1);
		await expect(page.getByRole("option", { name: "M" })).toBeVisible();
	});

	test("explains an over-long payload", async ({ page }) => {
		await gotoAppReady(page, "/tools/qr-generator");
		await page.getByTestId("qr-generator-input").fill("x".repeat(400));
		await expect(page.getByTestId("qr-generator-status")).toContainText("bytes; this QR");
	});

	test("has no serious axe violations and keeps touch targets at 44px", async ({ page }) => {
		await gotoAppReady(page, "/tools/qr-generator");
		await expectNoSeriousAxeViolations(page);
		await expectTouchTargetsAtLeast44(page);
		await expectNoHorizontalOverflow(page, "375px qr-generator");
	});
});
