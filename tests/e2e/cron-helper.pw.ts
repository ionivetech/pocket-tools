import { expect, test } from "@playwright/test";
import {
	expectNoHorizontalOverflow,
	expectNoSeriousAxeViolations,
	expectTouchTargetsAtLeast44,
	gotoAppReady,
	openToolOptions,
} from "./helpers/app";

test.describe("Cron helper", () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test("reads the weekday sample in plain words", async ({ page }) => {
		await gotoAppReady(page, "/tools/cron-helper");
		await openToolOptions(page);
		await page.getByTestId("cron-helper-sample").click();
		await expect(page.getByTestId("cron-helper-result")).toContainText("every weekday");
	});

	test("explains an out-of-range field", async ({ page }) => {
		await gotoAppReady(page, "/tools/cron-helper");
		await page.getByTestId("cron-helper-expression").fill("99 * * * *");
		await expect(page.getByTestId("cron-helper-status")).toContainText("minute (0–59)");
	});

	test("has no serious axe violations and keeps touch targets at 44px", async ({ page }) => {
		await gotoAppReady(page, "/tools/cron-helper");
		await expectNoSeriousAxeViolations(page);
		await expectTouchTargetsAtLeast44(page);
		await expectNoHorizontalOverflow(page, "375px cron-helper");
	});
});
