import { expect, test } from "@playwright/test";
import {
	expectNoHorizontalOverflow,
	expectNoSeriousAxeViolations,
	expectTouchTargetsAtLeast44,
	gotoAppReady,
	openToolOptions,
} from "./helpers/app";

test.describe("cURL converter", () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test("converts the sample POST to fetch code", async ({ page }) => {
		await gotoAppReady(page, "/tools/curl-converter");
		await openToolOptions(page);
		await page.getByTestId("curl-converter-sample").click();
		await expect(page.getByTestId("curl-converter-output")).toHaveValue(/method: "POST"/);
		await expect(page.getByTestId("curl-converter-status")).toContainText(
			"POST https://api.example.com/users.",
		);
	});

	test("rejects non-curl input with guidance", async ({ page }) => {
		await gotoAppReady(page, "/tools/curl-converter");
		await page.getByTestId("curl-converter-input").fill("wget https://x.test");
		await expect(page.getByTestId("curl-converter-status")).toContainText("start with curl");
	});

	test("has no serious axe violations and keeps touch targets at 44px", async ({ page }) => {
		await gotoAppReady(page, "/tools/curl-converter");
		await expectNoSeriousAxeViolations(page);
		await expectTouchTargetsAtLeast44(page);
		await expectNoHorizontalOverflow(page, "375px curl-converter");
	});
});
