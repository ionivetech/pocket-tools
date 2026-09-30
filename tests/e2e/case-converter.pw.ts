import { expect, test } from "@playwright/test";
import {
	expectNoHorizontalOverflow,
	expectNoSeriousAxeViolations,
	expectTouchTargetsAtLeast44,
	gotoAppReady,
	openToolOptions,
} from "./helpers/app";

test.describe("Case converter", () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test("lists all seven variants for the sample", async ({ page }) => {
		await gotoAppReady(page, "/tools/case-converter");
		await openToolOptions(page);
		await page.getByTestId("case-converter-sample").click();
		await expect(page.getByTestId("case-converter-variants")).toContainText("HELLO WORLD EXAMPLE");
		await expect(page.getByTestId("case-converter-variants")).toContainText("helloWorldExample");
	});

	test("copies one variant with a toast", async ({ page }) => {
		await gotoAppReady(page, "/tools/case-converter");
		await openToolOptions(page);
		await page.getByTestId("case-converter-sample").click();
		await page.getByTestId("tool-options-done").click();
		await page.getByTestId("case-converter-copy-upper").click();
		await expect(page.getByTestId("app-toast")).toContainText("Copied UPPERCASE.");
	});

	test("has no serious axe violations and keeps touch targets at 44px", async ({ page }) => {
		await gotoAppReady(page, "/tools/case-converter");
		await expectNoSeriousAxeViolations(page);
		await expectTouchTargetsAtLeast44(page);
		await expectNoHorizontalOverflow(page, "375px case-converter");
	});
});
