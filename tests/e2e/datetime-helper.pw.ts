import { expect, test } from "@playwright/test";
import {
	expectNoHorizontalOverflow,
	expectNoSeriousAxeViolations,
	expectTouchTargetsAtLeast44,
	gotoAppReady,
	openToolOptions,
} from "./helpers/app";

test.describe("Date and time helper", () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test("reads the epoch timestamp", async ({ page }) => {
		await gotoAppReady(page, "/tools/datetime-helper");
		await page.getByTestId("datetime-helper-input").fill("0");
		await expect(page.getByTestId("datetime-helper-result")).toContainText(
			"1970-01-01T00:00:00.000Z",
		);
	});

	test("fills now on request", async ({ page }) => {
		await gotoAppReady(page, "/tools/datetime-helper");
		await openToolOptions(page);
		await page.getByTestId("datetime-helper-now").click();
		await expect(page.getByTestId("datetime-helper-status")).toHaveText("Date read.");
	});

	test("has no serious axe violations and keeps touch targets at 44px", async ({ page }) => {
		await gotoAppReady(page, "/tools/datetime-helper");
		await expectNoSeriousAxeViolations(page);
		await expectTouchTargetsAtLeast44(page);
		await expectNoHorizontalOverflow(page, "375px datetime-helper");
	});
});
