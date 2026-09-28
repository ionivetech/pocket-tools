import { expect, test } from "@playwright/test";
import {
	expectNoHorizontalOverflow,
	expectNoSeriousAxeViolations,
	expectTouchTargetsAtLeast44,
	gotoAppReady,
} from "./helpers/app";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

test.describe("UUID/ULID generator", () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test("generates a batch of UUID v4s by default", async ({ page }) => {
		await gotoAppReady(page, "/tools/uuid-generator");
		const rows = page.getByTestId("uuid-generator-list").locator("code");
		await expect(rows).toHaveCount(10);
		await expect(rows.first()).toHaveText(uuidPattern);
	});

	test("regenerates a requested count when changed", async ({ page }) => {
		await gotoAppReady(page, "/tools/uuid-generator");
		await page.getByTestId("uuid-count").locator("input").fill("3");
		await page.getByTestId("uuid-generate").click();
		await expect(page.getByTestId("uuid-generator-list").locator("code")).toHaveCount(3);
	});

	test("switches to ULID and copies a single row", async ({ page }) => {
		await gotoAppReady(page, "/tools/uuid-generator");
		await page.getByTestId("uuid-version").click();
		await page.getByRole("option", { name: "ULID" }).click();
		await page.getByTestId("uuid-generate").click();

		const firstRow = page.getByTestId("uuid-generator-list").locator("code").first();
		await expect(firstRow).toHaveText(/^[0-9A-HJKMNP-TV-Z]{26}$/);

		await page.getByTestId("uuid-copy-0").click();
		await expect(page.getByTestId("uuid-copy-status-0")).toContainText("Copied.");
	});

	test("has no serious axe violations and keeps touch targets at 44px", async ({ page }) => {
		await gotoAppReady(page, "/tools/uuid-generator");
		await expectNoSeriousAxeViolations(page);
		await expectTouchTargetsAtLeast44(page);
		await expectNoHorizontalOverflow(page, "375px uuid-generator");
	});
});
