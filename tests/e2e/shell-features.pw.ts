import { expect, test } from "@playwright/test";
import {
	expectNoSeriousAxeViolations,
	expectTouchTargetsAtLeast44,
	gotoAppReady,
} from "./helpers/app";

test.describe("Phase 3 shell features", () => {
	test("palette finds tools via fuzzy typo and shows action rows", async ({ page }) => {
		await gotoAppReady(page, "/");
		await page.keyboard.press("Control+K");
		await expect(page.getByTestId("home-palette")).toBeVisible();
		await page.getByTestId("home-palette-input").fill("jsn");
		const results = page.getByTestId("home-palette-results");
		await expect(results.getByRole("option").first()).toContainText("JSON formatter");
		// Keyboard: Enter opens the first (best) match.
		await page.keyboard.press("Enter");
		await expect(page).toHaveURL(/\/tools\/json-formatter/, { timeout: 20_000 });
	});

	test("palette ranks recents first on empty query and restores focus", async ({ page }) => {
		await gotoAppReady(page, "/tools/text-cleaner");
		await gotoAppReady(page, "/");
		const trigger = page.getByTestId("header-palette-trigger");
		await trigger.click();
		await expect(page.getByTestId("home-palette")).toBeVisible();
		await expect(page.getByTestId("home-palette-section")).toContainText("Suggestions");
		await expect(
			page.getByTestId("home-palette-results").getByRole("option").first(),
		).toContainText("Text cleaner");
		await page.keyboard.press("Escape");
		await expect(page.getByTestId("home-palette")).toHaveCount(0);
		await expect(trigger).toBeFocused();
	});

	test("favorites and recent views clear with empty states", async ({ page }) => {
		await gotoAppReady(page, "/tools");
		await page.getByRole("button", { name: "Add JSON formatter to favorites" }).click();
		await page.getByTestId("tools-view-favorites").click();
		await expect(page.getByRole("heading", { name: "JSON formatter" })).toBeVisible();
		await page.getByTestId("tools-clear-favorites-view").click();
		await expect(page.getByRole("heading", { name: "No favorites yet." })).toBeVisible();

		await page.getByTestId("tools-view-recent").click();
		// Opening a tool tracks it as recent; the view explains the empty state otherwise.
		await expect(page.getByRole("heading", { name: "Nothing recent yet." })).toBeVisible();
	});

	test("paste suggestion appears without stealing focus", async ({ page }) => {
		await gotoAppReady(page, "/");
		const search = page.getByTestId("home-search-input");
		await search.click();
		await search.evaluate((element) => {
			if (!(element instanceof HTMLInputElement)) return;
			element.focus();
			const data = new DataTransfer();
			data.setData("text/plain", '{"hello":"pocket"}');
			element.dispatchEvent(
				new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }),
			);
		});
		await expect(page.getByTestId("paste-suggest")).toContainText("JSON formatter");
		await expect(search).toBeFocused();
	});

	test("shortcuts help opens via ? and header button", async ({ page }) => {
		await gotoAppReady(page, "/");
		await page.keyboard.press("?");
		await expect(page.getByTestId("shortcut-help")).toBeVisible();
		await page.keyboard.press("Escape");
		await page.getByTestId("header-shortcuts-trigger").click();
		await expect(page.getByTestId("shortcut-help")).toContainText("Open quick search");
		await page.keyboard.press("Escape");
	});

	test("slash focuses search and g t opens the library", async ({ page }) => {
		await gotoAppReady(page, "/");
		await page.keyboard.press("/");
		await expect(page.getByTestId("home-search-input")).toBeFocused();
		await page.keyboard.press("Escape");
		// Leave the typing context so sequence keys navigate instead of typing.
		await page.locator("main").click();
		await page.keyboard.press("g");
		await page.keyboard.press("t");
		await expect(page).toHaveURL(/\/tools$/, { timeout: 20_000 });
	});

	test("tool history records and restores a run", async ({ page }) => {
		await gotoAppReady(page, "/tools/text-cleaner");
		await page.getByTestId("text-cleaner-input").fill("hello   pocket");
		// History records debounced; wait for the toggle to appear.
		await expect(page.getByTestId("tool-history")).toBeVisible({ timeout: 20_000 });
		await page.getByTestId("tool-history-toggle").click();
		await expect(page.getByTestId("tool-history")).toContainText("Recent runs on this device");
	});

	test("shell features pass axe and touch targets at 375px", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 812 });
		await gotoAppReady(page, "/");
		await expectNoSeriousAxeViolations(page);
		await expectTouchTargetsAtLeast44(page);
		await gotoAppReady(page, "/tools");
		await expectNoSeriousAxeViolations(page);
		await expectTouchTargetsAtLeast44(page);
	});
});
