import { expect, test } from "@playwright/test";
import {
	expectNoHorizontalOverflow,
	expectNoSeriousAxeViolations,
	expectTouchTargetsAtLeast44,
	gotoAppReady,
	openToolOptions,
} from "./helpers/app";

test.describe("JWT decoder", () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test("decodes a sample token into header and payload", async ({ page }) => {
		await gotoAppReady(page, "/tools/jwt-decoder");
		await openToolOptions(page);
		await page.getByTestId("jwt-decoder-sample").click();
		await expect(page.getByTestId("jwt-decoder-payload")).toHaveValue(/Test User/);
		await expect(page.getByTestId("jwt-decoder-header")).toHaveValue(/HS256/);
		await expect(page.getByTestId("jwt-decoder-status")).toContainText("never checked");
	});

	test("explains a malformed token with an actionable error", async ({ page }) => {
		await gotoAppReady(page, "/tools/jwt-decoder");
		await page.getByTestId("jwt-decoder-input").fill("not-a-token");
		await expect(page.getByTestId("jwt-decoder-status")).toContainText("three parts");
	});

	test("copies the payload with a toast", async ({ page }) => {
		await gotoAppReady(page, "/tools/jwt-decoder");
		await openToolOptions(page);
		await page.getByTestId("jwt-decoder-sample").click();
		await page.getByTestId("tool-options-done").click();
		await page.getByTestId("tool-actions-copy").click();
		await expect(page.getByTestId("app-toast")).toContainText("Copied to clipboard.");
	});

	test("has no serious axe violations and keeps touch targets at 44px", async ({ page }) => {
		await gotoAppReady(page, "/tools/jwt-decoder");
		await expectNoSeriousAxeViolations(page);
		await expectTouchTargetsAtLeast44(page);
		await expectNoHorizontalOverflow(page, "375px jwt-decoder");
	});
});

test("a pasted token never leaves the textarea", async ({ page }) => {
	await gotoAppReady(page, "/tools/jwt-decoder");
	await page.getByTestId("jwt-decoder-sample").click();
	await expect(page.getByTestId("jwt-decoder-payload")).toHaveValue(/Test User/);

	// A credential must not end up in the URL (history, server logs, Referer) or
	// in localStorage. This is the regression guard for both paths at once.
	expect(page.url()).not.toContain("eyJ");
	const dumped = await page.evaluate(() => JSON.stringify(window.localStorage));
	expect(dumped).not.toContain("eyJ");
	expect(dumped).not.toContain("eyJzdWIiOiIxMjMi");
});
