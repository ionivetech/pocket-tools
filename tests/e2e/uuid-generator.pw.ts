import { expect, test } from "@playwright/test";
import {
	expectNoHorizontalOverflow,
	expectNoSeriousAxeViolations,
	expectTouchTargetsAtLeast44,
	gotoAppReady,
} from "./helpers/app";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ulidPattern = /^[0-9A-HJKMNP-TV-Z]{26}$/;

test.describe("UUID/ULID generator", () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test("generates a single UUID v4 by default", async ({ page }) => {
		await gotoAppReady(page, "/tools/uuid-generator");
		await expect(page.getByTestId("uuid-generator-output")).toHaveValue(uuidPattern);
	});

	test("regenerates a requested count when changed", async ({ page }) => {
		await gotoAppReady(page, "/tools/uuid-generator");
		await page.getByTestId("uuid-count").locator("input").fill("3");
		await page.getByTestId("uuid-generate").click();
		const value = await page.getByTestId("uuid-generator-output").inputValue();
		expect(value.split("\n")).toHaveLength(3);
	});

	test("switches to ULID and copies the result with a toast", async ({ page }) => {
		await gotoAppReady(page, "/tools/uuid-generator");
		await page.getByTestId("uuid-version").click();
		await page.getByRole("option", { name: "ULID" }).click();
		await page.getByTestId("uuid-generate").click();
		await expect(page.getByTestId("uuid-generator-output")).toHaveValue(ulidPattern);

		await page.getByTestId("tool-actions-copy").click();
		await expect(page.getByTestId("app-toast")).toContainText("Copied to clipboard.");
	});

	test("formats ids as uppercase or compact", async ({ page }) => {
		await gotoAppReady(page, "/tools/uuid-generator");

		await page.getByTestId("uuid-uppercase").click();
		await expect(page.getByTestId("uuid-generator-output")).toHaveValue(
			/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/,
		);

		await page.getByTestId("uuid-hyphens").click();
		await expect(page.getByTestId("uuid-generator-output")).toHaveValue(/^[0-9A-F]{32}$/);
	});

	test("converts a UUID v7 to a ULID keeping the timestamp", async ({ page }) => {
		await gotoAppReady(page, "/tools/uuid-generator");

		await page.getByTestId("uuid-version").click();
		await page.getByRole("option", { name: "UUID v7 (time-ordered)" }).click();
		await page.getByTestId("uuid-generate").click();

		const source = await page.getByTestId("uuid-generator-output").inputValue();
		await page.getByTestId("uuid-to-ulid-input").fill(source);
		await expect(page.getByTestId("uuid-to-ulid-output")).toHaveText(ulidPattern);
		await expect(page.getByTestId("uuid-to-ulid-info")).toContainText("timestamp preserved");
	});

	test("converts a ULID to a UUID v7 keeping the timestamp", async ({ page }) => {
		await gotoAppReady(page, "/tools/uuid-generator");

		await page.getByTestId("uuid-version").click();
		await page.getByRole("option", { name: "ULID" }).click();
		await page.getByTestId("uuid-generate").click();

		const source = await page.getByTestId("uuid-generator-output").inputValue();
		await page.getByTestId("ulid-to-uuid-input").fill(source);
		await expect(page.getByTestId("ulid-to-uuid-output")).toHaveText(uuidPattern);
	});

	test("has no serious axe violations and keeps touch targets at 44px", async ({ page }) => {
		await gotoAppReady(page, "/tools/uuid-generator");
		await expectNoSeriousAxeViolations(page);
		await expectTouchTargetsAtLeast44(page);
		await expectNoHorizontalOverflow(page, "375px uuid-generator");
	});
});
