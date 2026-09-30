import { expect, test } from "@playwright/test";
import {
	expectNoHorizontalOverflow,
	expectNoSeriousAxeViolations,
	expectTouchTargetsAtLeast44,
	gotoAppReady,
	openToolOptions,
} from "./helpers/app";

test.describe("Diff checker", () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test("marks sample changes as removed and added", async ({ page }) => {
		await gotoAppReady(page, "/tools/diff-checker");
		await openToolOptions(page);
		await page.getByTestId("diff-checker-sample").click();
		await expect(page.getByTestId("diff-checker-status")).toContainText("1 removed, 1 added");
		await expect(page.getByTestId("diff-checker-rows")).toContainText("Buy bread");
	});

	test("reports identical texts as matching", async ({ page }) => {
		await gotoAppReady(page, "/tools/diff-checker");
		await page.getByTestId("diff-checker-original").fill("same");
		await page.getByTestId("diff-checker-changed").fill("same");
		await expect(page.getByTestId("diff-checker-status")).toContainText("No differences");
	});

	test("has no serious axe violations and keeps touch targets at 44px", async ({ page }) => {
		await gotoAppReady(page, "/tools/diff-checker");
		await expectNoSeriousAxeViolations(page);
		await expectTouchTargetsAtLeast44(page);
		await expectNoHorizontalOverflow(page, "375px diff-checker");
	});
});
