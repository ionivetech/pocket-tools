import { expect, test } from "@playwright/test";
import {
	expectNoHorizontalOverflow,
	expectNoSeriousAxeViolations,
	expectTouchTargetsAtLeast44,
	gotoAppReady,
} from "./helpers/app";

test.describe("Color picker", () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test("converts the default blue to rgb", async ({ page }) => {
		await gotoAppReady(page, "/tools/color-picker");
		await expect(page.getByTestId("color-picker-result")).toContainText("rgb(29, 78, 216)");
		await expect(page.getByTestId("color-picker-status")).toContainText("Reads best on white");
	});

	test("explains an unknown color name", async ({ page }) => {
		await gotoAppReady(page, "/tools/color-picker");
		await page.getByTestId("color-picker-input").fill("blurple");
		await expect(page.getByTestId("color-picker-status")).toContainText("Use HEX");
	});

	test("has no serious axe violations and keeps touch targets at 44px", async ({ page }) => {
		await gotoAppReady(page, "/tools/color-picker");
		await expectNoSeriousAxeViolations(page);
		await expectTouchTargetsAtLeast44(page);
		await expectNoHorizontalOverflow(page, "375px color-picker");
	});
});
