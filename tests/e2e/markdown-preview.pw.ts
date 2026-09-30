import { expect, test } from "@playwright/test";
import {
	expectNoHorizontalOverflow,
	expectNoSeriousAxeViolations,
	expectTouchTargetsAtLeast44,
	gotoAppReady,
	openToolOptions,
} from "./helpers/app";

test.describe("Markdown preview", () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test("renders the sample as headings and bold text", async ({ page }) => {
		await gotoAppReady(page, "/tools/markdown-preview");
		await openToolOptions(page);
		await page.getByTestId("markdown-preview-sample").click();
		await expect(page.getByTestId("markdown-preview-output").locator("h1")).toHaveText(
			"Shopping list",
		);
		await expect(page.getByTestId("markdown-preview-output").locator("strong")).toHaveText("Milk");
	});

	test("shows the supported subset note", async ({ page }) => {
		await gotoAppReady(page, "/tools/markdown-preview");
		await page.getByTestId("markdown-preview-input").fill("# Hi");
		await expect(page.locator(".pt-markdown-preview")).toBeVisible();
	});

	test("has no serious axe violations and keeps touch targets at 44px", async ({ page }) => {
		await gotoAppReady(page, "/tools/markdown-preview");
		await expectNoSeriousAxeViolations(page);
		await expectTouchTargetsAtLeast44(page);
		await expectNoHorizontalOverflow(page, "375px markdown-preview");
	});
});
