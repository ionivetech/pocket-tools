import { expect, test } from "@playwright/test";
import {
	expectNoHorizontalOverflow,
	expectNoSeriousAxeViolations,
	expectTouchTargetsAtLeast44,
	gotoAppReady,
	openToolOptions,
} from "./helpers/app";

test.describe("Table to Markdown", () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test("converts the sample to a markdown table", async ({ page }) => {
		await gotoAppReady(page, "/tools/table-to-markdown");
		await openToolOptions(page);
		await page.getByTestId("table-to-markdown-sample").click();
		await expect(page.getByTestId("table-to-markdown-output")).toHaveValue(/| Name | Role |/);
		await expect(page.getByTestId("table-to-markdown-status")).toContainText("3 rows, 2 columns");
	});

	test("has no serious axe violations and keeps touch targets at 44px", async ({ page }) => {
		await gotoAppReady(page, "/tools/table-to-markdown");
		await expectNoSeriousAxeViolations(page);
		await expectTouchTargetsAtLeast44(page);
		await expectNoHorizontalOverflow(page, "375px table-to-markdown");
	});
});
