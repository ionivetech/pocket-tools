import { expect, test } from "@playwright/test";
import {
	expectNoHorizontalOverflow,
	expectNoSeriousAxeViolations,
	expectTouchTargetsAtLeast44,
	gotoAppReady,
	openToolOptions,
} from "./helpers/app";

test.describe("Regex tester", () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test("finds sample matches with capture groups", async ({ page }) => {
		await gotoAppReady(page, "/tools/regex-tester");
		await openToolOptions(page);
		await page.getByTestId("regex-tester-sample").click();
		await expect(page.getByTestId("regex-tester-status")).toContainText("2 matches");
		await expect(page.getByTestId("regex-tester-matches")).toContainText("#42");
	});

	test("explains a broken pattern", async ({ page }) => {
		await gotoAppReady(page, "/tools/regex-tester");
		await page.getByTestId("regex-tester-pattern").fill("(oops");
		await page.getByTestId("regex-tester-sample-input").fill("oops");
		await expect(page.getByTestId("regex-tester-status")).toContainText("does not compile");
	});

	test("has no serious axe violations and keeps touch targets at 44px", async ({ page }) => {
		await gotoAppReady(page, "/tools/regex-tester");
		await expectNoSeriousAxeViolations(page);
		await expectTouchTargetsAtLeast44(page);
		await expectNoHorizontalOverflow(page, "375px regex-tester");
	});
});
