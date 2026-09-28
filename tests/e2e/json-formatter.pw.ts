import { expect, test } from "@playwright/test";
import {
	expectNoHorizontalOverflow,
	expectNoSeriousAxeViolations,
	expectTouchTargetsAtLeast44,
	gotoAppReady,
	waitForAppReady,
} from "./helpers/app";

test.describe("JSON formatter", () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test("formats valid JSON and reports the exact error location for invalid JSON", async ({
		page,
	}) => {
		await gotoAppReady(page, "/tools/json-formatter");

		const input = page.getByTestId("json-formatter-input");
		const output = page.getByTestId("json-formatter-output");
		const status = page.getByTestId("json-formatter-status");

		await input.fill('{"b":1,"a":2}');
		await expect(status).toContainText("Valid JSON, formatted.");
		await expect(output).toHaveValue('{\n  "b": 1,\n  "a": 2\n}');

		await page.getByTestId("json-formatter-minify").click();
		await expect(output).toHaveValue('{"b":1,"a":2}');
		await expect(status).toContainText("Valid JSON, minified.");

		await page.getByTestId("json-formatter-format").click();
		await input.fill('{"a": 1,}');
		await expect(status).toContainText(/Line \d+, column \d+/);
	});

	test("shows an empty state before any input", async ({ page }) => {
		await gotoAppReady(page, "/tools/json-formatter");
		await page.getByTestId("json-formatter-input").fill("");
		await expect(page.getByTestId("json-formatter-status")).toContainText(
			"Paste or type JSON to format",
		);
	});

	test("keeps a shareable link that restores the same input", async ({ page }) => {
		await gotoAppReady(page, "/tools/json-formatter");
		await page.getByTestId("json-formatter-input").fill('{"shared":true}');
		await expect(page).toHaveURL(/[?&]s=/);

		const shareUrl = page.url();
		await page.goto(shareUrl, { timeout: 20_000 });
		await waitForAppReady(page);
		await expect(page.getByTestId("json-formatter-input")).toHaveValue('{"shared":true}');
	});

	test("has no serious axe violations and keeps touch targets at 44px", async ({ page }) => {
		await gotoAppReady(page, "/tools/json-formatter");
		await expectNoSeriousAxeViolations(page);
		await expectTouchTargetsAtLeast44(page);
		await expectNoHorizontalOverflow(page, "375px json-formatter");
	});
});
