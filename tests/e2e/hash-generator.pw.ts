import { expect, test } from "@playwright/test";
import {
	expectNoHorizontalOverflow,
	expectNoSeriousAxeViolations,
	expectTouchTargetsAtLeast44,
	gotoAppReady,
	openToolOptions,
} from "./helpers/app";

test.describe("Hash generator", () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test("hashes hello with SHA-256 to the known vector", async ({ page }) => {
		await gotoAppReady(page, "/tools/hash-generator");
		await openToolOptions(page);
		await page.getByTestId("hash-generator-input").fill("hello");
		await page.getByTestId("hash-generator-generate").click();
		await expect(page.getByTestId("hash-generator-output")).toHaveValue(
			"2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
		);
	});

	test("asks for input before generating", async ({ page }) => {
		await gotoAppReady(page, "/tools/hash-generator");
		await expect(page.getByTestId("hash-generator-status")).toContainText(
			"Type some text to fingerprint it.",
		);
	});

	test("has no serious axe violations and keeps touch targets at 44px", async ({ page }) => {
		await gotoAppReady(page, "/tools/hash-generator");
		await expectNoSeriousAxeViolations(page);
		await expectTouchTargetsAtLeast44(page);
		await expectNoHorizontalOverflow(page, "375px hash-generator");
	});
});
