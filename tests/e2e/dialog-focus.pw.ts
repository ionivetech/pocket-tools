import { expect, test } from "@playwright/test";
import { expectNoSeriousAxeViolations, gotoAppReady, openToolOptions } from "./helpers/app";

test.describe("dialog initial focus", () => {
	test("palette focuses the search input on open, not the close button", async ({ page }) => {
		await gotoAppReady(page, "/");
		await page.keyboard.press("Control+K");
		await expect(page.getByTestId("home-palette-input")).toBeFocused();
		await expectNoSeriousAxeViolations(page);
		await page.keyboard.press("Escape");
		await expect(page.getByTestId("home-palette")).toBeHidden();
	});

	test("shortcut help focuses its content, not the close button", async ({ page }) => {
		await gotoAppReady(page, "/");
		await page.keyboard.press("?");
		await expect(page.getByTestId("shortcut-help-list")).toBeFocused();
		await page.keyboard.press("Escape");
		await expect(page.getByTestId("shortcut-help")).toBeHidden();
	});
});

test.describe("dialog initial focus on mobile", () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test("tool options dialog focuses Done, not the close button", async ({ page }) => {
		await gotoAppReady(page, "/tools/text-cleaner");
		await openToolOptions(page);
		await expect(page.getByTestId("tool-options-done")).toBeFocused();
	});
});
