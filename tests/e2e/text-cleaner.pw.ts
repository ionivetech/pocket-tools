import { expect, test } from "@playwright/test";
import {
	expectNoHorizontalOverflow,
	expectNoSeriousAxeViolations,
	expectTouchTargetsAtLeast44,
	gotoAppReady,
} from "./helpers/app";

test.describe("Text cleaner", () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test("cleans whitespace and reports live counts", async ({ page }) => {
		await gotoAppReady(page, "/tools/text-cleaner");

		await page.getByTestId("text-cleaner-input").fill("  Hello   World  ");
		await expect(page.getByTestId("text-cleaner-output")).toHaveValue("Hello World");

		const counts = page.getByTestId("text-cleaner-counts");
		await expect(counts).toContainText("2");
		await expect(counts).toContainText("11");
	});

	test("applies a case transform", async ({ page }) => {
		await gotoAppReady(page, "/tools/text-cleaner");
		await page.getByTestId("text-cleaner-input").fill("hello world");
		await page.getByTestId("text-cleaner-case").click();
		await page.getByRole("option", { name: "UPPERCASE" }).click();
		await expect(page.getByTestId("text-cleaner-output")).toHaveValue("HELLO WORLD");
	});

	test("toggles cleanup options off", async ({ page }) => {
		await gotoAppReady(page, "/tools/text-cleaner");
		await page.getByTestId("text-cleaner-trim").click();
		await page.getByTestId("text-cleaner-collapse").click();
		await page.getByTestId("text-cleaner-input").fill("  keep   spacing  ");
		await expect(page.getByTestId("text-cleaner-output")).toHaveValue("  keep   spacing  ");
	});

	test("removes empty and duplicate lines", async ({ page }) => {
		await gotoAppReady(page, "/tools/text-cleaner");

		await page.getByTestId("text-cleaner-empty-lines").click();
		await page.getByTestId("text-cleaner-duplicate-lines").click();
		await page.getByTestId("text-cleaner-input").fill("b\n\na\nb\nc");
		await expect(page.getByTestId("text-cleaner-output")).toHaveValue("b\na\nc");
	});

	test("has no serious axe violations and keeps touch targets at 44px", async ({ page }) => {
		await gotoAppReady(page, "/tools/text-cleaner");
		await expectNoSeriousAxeViolations(page);
		await expectTouchTargetsAtLeast44(page);
		await expectNoHorizontalOverflow(page, "375px text-cleaner");
	});
});
