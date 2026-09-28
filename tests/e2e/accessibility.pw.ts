import { expect, test } from "@playwright/test";
import {
	expectNoSeriousAxeViolations,
	expectTouchTargetsAtLeast44,
	gotoAppReady,
} from "./helpers/app";

test.use({ viewport: { width: 375, height: 812 } });

for (const route of ["/", "/tools", "/tools/json-formatter"]) {
	test(`${route} has no serious axe violations`, async ({ page }) => {
		await gotoAppReady(page, route);
		if (route === "/tools/json-formatter") {
			await expect(page.getByTestId("tool-placeholder")).toBeVisible();
		}
		await expectNoSeriousAxeViolations(page);
	});

	test(`${route} keeps visible interactive targets at 44px`, async ({ page }) => {
		await gotoAppReady(page, route);
		if (route === "/tools/json-formatter") {
			await expect(page.getByTestId("tool-placeholder")).toBeVisible();
		}
		await expectTouchTargetsAtLeast44(page, {
			requireWidth: route === "/tools/json-formatter",
		});
	});
}

test("/tools/json-formatter exposes keyboard focus with a visible indicator", async ({ page }) => {
	await gotoAppReady(page, "/tools/json-formatter");
	await expect(page.getByTestId("tool-placeholder")).toBeVisible();

	const backLink = page.getByTestId("tool-detail-back-link");
	await backLink.focus();
	await page.keyboard.press("Shift+Tab");
	await page.keyboard.press("Tab");
	await expect(backLink).toBeFocused();

	const focusStyle = await backLink.evaluate((element) => {
		const styles = getComputedStyle(element);
		return {
			style: styles.outlineStyle,
			width: Number.parseFloat(styles.outlineWidth),
		};
	});
	expect(focusStyle.style).not.toBe("none");
	expect(focusStyle.width).toBeGreaterThan(0);
});
