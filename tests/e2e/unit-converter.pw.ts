import { expect, test } from "@playwright/test";
import {
	expectNoHorizontalOverflow,
	expectNoSeriousAxeViolations,
	expectTouchTargetsAtLeast44,
	gotoAppReady,
	openToolOptions,
} from "./helpers/app";

test.describe("Unit converter", () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test("converts 1 km to 1000 m by default", async ({ page }) => {
		await gotoAppReady(page, "/tools/unit-converter");
		await expect(page.getByTestId("unit-converter-result")).toHaveText("1 km = 1000 m");
	});

	test("swaps units on request", async ({ page }) => {
		await gotoAppReady(page, "/tools/unit-converter");
		await openToolOptions(page);
		await page.getByTestId("unit-converter-swap").click();
		await expect(page.getByTestId("unit-converter-result")).toHaveText("1 m = 0.001 km");
	});

	test("has no serious axe violations and keeps touch targets at 44px", async ({ page }) => {
		await gotoAppReady(page, "/tools/unit-converter");
		await expectNoSeriousAxeViolations(page);
		await expectTouchTargetsAtLeast44(page);
		await expectNoHorizontalOverflow(page, "375px unit-converter");
	});
});
