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
			await expect(page.getByTestId("json-formatter-output")).toBeVisible();
		}
		await expectNoSeriousAxeViolations(page);
	});

	test(`${route} keeps visible interactive targets at 44px`, async ({ page }) => {
		await gotoAppReady(page, route);
		if (route === "/tools/json-formatter") {
			await expect(page.getByTestId("json-formatter-output")).toBeVisible();
		}
		await expectTouchTargetsAtLeast44(page);
	});
}

test("/keeps touch targets at 44px when the root font size drifts", async ({ page }) => {
	// CI reported a 44px control measuring 43.99997px. The floor was written in
	// rem, so a root font-size a hair under 16px dragged it below 44. Touch
	// targets are an absolute floor and must not move with type scale.
	await gotoAppReady(page, "/");
	await page.addStyleTag({ content: "html { font-size: 15.9999px !important; }" });
	await expectTouchTargetsAtLeast44(page);
});

test("/tools/json-formatter exposes keyboard focus with a visible indicator", async ({ page }) => {
	await gotoAppReady(page, "/tools/json-formatter");
	await expect(page.getByTestId("json-formatter-output")).toBeVisible();

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
