import { expect, type Page, test } from "@playwright/test";
import {
	expectNoHorizontalOverflow,
	expectNoSeriousAxeViolations,
	expectTouchTargetsAtLeast44,
	gotoAppReady,
	openToolOptions,
	waitForAppReady,
} from "./helpers/app";

/** CodeMirror renders one div per line, so the document is the lines joined. */
async function editorText(page: Page, testid: string): Promise<string> {
	const lines = await page.locator(`[data-testid="${testid}"] .cm-line`).allTextContents();
	return lines.join("\n");
}

test.describe("JSON formatter", () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test("formats valid JSON and reports the exact error location for invalid JSON", async ({
		page,
	}) => {
		await gotoAppReady(page, "/tools/json-formatter");

		const input = page.getByTestId("json-formatter-input");
		const status = page.getByTestId("json-formatter-status");

		await input.fill('{"b":1,"a":2}');
		await expect(status).toContainText("Valid JSON, formatted.");
		expect(await editorText(page, "json-formatter-output")).toBe('{\n  "b": 1,\n  "a": 2\n}');

		await openToolOptions(page);
		await page.getByTestId("json-formatter-minify").click();
		expect(await editorText(page, "json-formatter-output")).toBe('{"b":1,"a":2}');
		await expect(status).toContainText("Valid JSON, minified.");

		await page.getByTestId("json-formatter-format").click();
		await input.fill('{"a": 1,}');
		await expect(status).toContainText(/Line \d+, column \d+/);
	});

	test("sorts keys on demand and shows result stats", async ({ page }) => {
		await gotoAppReady(page, "/tools/json-formatter");

		const input = page.getByTestId("json-formatter-input");

		await input.fill('{"b":1,"a":2}');
		expect(await editorText(page, "json-formatter-output")).toBe('{\n  "b": 1,\n  "a": 2\n}');

		await openToolOptions(page);
		await page.getByTestId("json-formatter-sort-keys").click();
		expect(await editorText(page, "json-formatter-output")).toBe('{\n  "a": 2,\n  "b": 1\n}');
		await expect(page.getByTestId("json-formatter-stats")).toContainText("2 keys");
	});

	test("shows an empty state before any input", async ({ page }) => {
		await gotoAppReady(page, "/tools/json-formatter");
		await openToolOptions(page);
		await page.getByTestId("json-formatter-clear").click();
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
		expect(await editorText(page, "json-formatter-input")).toBe('{"shared":true}');
	});

	test("has no serious axe violations and keeps touch targets at 44px", async ({ page }) => {
		await gotoAppReady(page, "/tools/json-formatter");
		await expectNoSeriousAxeViolations(page);
		await expectTouchTargetsAtLeast44(page);
		await expectNoHorizontalOverflow(page, "375px json-formatter");
	});
});
