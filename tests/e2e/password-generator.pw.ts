import { expect, test } from "@playwright/test";
import {
	expectNoHorizontalOverflow,
	expectNoSeriousAxeViolations,
	expectTouchTargetsAtLeast44,
	gotoAppReady,
	openToolOptions,
} from "./helpers/app";

test.describe("Password generator", () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test("generates a 16-character password on open", async ({ page }) => {
		await gotoAppReady(page, "/tools/password-generator");
		await expect(page.getByTestId("password-generator-output")).toHaveValue(/^.{16}$/);
		await expect(page.getByTestId("password-generator-status")).toContainText("Nothing is stored");
	});

	test("requires at least one character set", async ({ page }) => {
		await gotoAppReady(page, "/tools/password-generator");
		await openToolOptions(page);
		await page.getByTestId("password-generator-lower").click();
		await page.getByTestId("password-generator-upper").click();
		await page.getByTestId("password-generator-digits").click();
		await page.getByTestId("password-generator-generate").click();
		await expect(page.getByTestId("password-generator-status")).toContainText(
			"at least one character set",
		);
	});

	test("has no serious axe violations and keeps touch targets at 44px", async ({ page }) => {
		await gotoAppReady(page, "/tools/password-generator");
		await expectNoSeriousAxeViolations(page);
		await expectTouchTargetsAtLeast44(page);
		await expectNoHorizontalOverflow(page, "375px password-generator");
	});
});
