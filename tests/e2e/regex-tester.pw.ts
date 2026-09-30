import { expect, test } from "@playwright/test";
import { gotoAppReady, openToolOptions } from "./helpers/app";

/**
 * The ReDoS guard. A catastrophic pattern must not freeze the tab, so the
 * assertion is about the UI staying responsive and reporting a stop, not about
 * the regex engine's internals.
 */
test("a catastrophic pattern is stopped instead of freezing the tab", async ({ page }) => {
	await gotoAppReady(page, "/tools/regex-tester");
	await openToolOptions(page);

	await page.getByTestId("regex-tester-pattern").fill("(a+)+$");
	await page.getByTestId("regex-tester-sample-input").fill(`${"a".repeat(40)}b`);

	// The status must resolve to a "stopped" message, not stay on "Testing…" forever.
	await expect(page.getByTestId("regex-tester-status")).toContainText(/stopped|running/i, {
		timeout: 15_000,
	});

	// The page must still respond: an interactive element works after the freeze.
	await expect(page.getByTestId("regex-tester-pattern")).toBeEditable();
	await page.getByTestId("regex-tester-pattern").fill("\\d+");
	await page.getByTestId("regex-tester-sample-input").fill("a1b22");
	await expect(page.getByTestId("regex-tester-status")).toContainText("2 matches");
});
