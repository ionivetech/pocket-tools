import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 375, height: 812 } });

for (const route of ["/", "/tools", "/tools/json-formatter"]) {
	test(`${route} has no serious axe violations`, async ({ page }) => {
		await page.goto(route);
		await expect(page.locator('[data-app-ready="true"]')).toBeVisible();
		if (route === "/tools/json-formatter") {
			await expect(page.getByTestId("tool-placeholder")).toBeVisible();
		}
		await page.evaluate(async () => {
			await Promise.all(
				document.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
			);
		});
		const results = await new AxeBuilder({ page }).analyze();
		const seriousViolations = results.violations.filter(
			(violation) => violation.impact === "critical" || violation.impact === "serious",
		);

		expect(seriousViolations).toEqual([]);
	});

	test(`${route} keeps visible interactive targets at 44px`, async ({ page }) => {
		await page.goto(route);
		await expect(page.locator('[data-app-ready="true"]')).toBeVisible();
		if (route === "/tools/json-formatter") {
			await expect(page.getByTestId("tool-placeholder")).toBeVisible();
		}
		const checkWidth = route === "/tools/json-formatter";
		const undersized = await page
			.locator("button:visible, a:visible, input:visible, select:visible, textarea:visible")
			.evaluateAll(
				(elements, requireWidth) =>
					elements
						.map((element) => {
							const bounds = element.getBoundingClientRect();
							return {
								name:
									element.getAttribute("aria-label") ??
									element.textContent?.trim().slice(0, 40) ??
									element.tagName,
								width: bounds.width,
								height: bounds.height,
							};
						})
						.filter(
							(element) =>
								(element.width > 0 || element.height > 0) &&
								(element.height < 44 || (requireWidth && element.width < 44)),
						),
				checkWidth,
			);
		expect(undersized).toEqual([]);
	});
}

test("/tools/json-formatter exposes keyboard focus with a visible indicator", async ({ page }) => {
	await page.goto("/tools/json-formatter");
	await expect(page.locator('[data-app-ready="true"]')).toBeVisible();
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
