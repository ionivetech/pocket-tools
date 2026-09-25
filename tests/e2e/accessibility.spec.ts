import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const route of ["/", "/tools"]) {
	test(`${route} has no serious axe violations`, async ({ page }) => {
		await page.goto(route);
		await expect(page.locator('[data-app-ready="true"]')).toBeVisible();
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
		const undersized = await page
			.locator("button:visible, a:visible, input:visible, select:visible, textarea:visible")
			.evaluateAll((elements) =>
				elements
					.map((element) => ({
						name:
							element.getAttribute("aria-label") ??
							element.textContent?.trim().slice(0, 40) ??
							element.tagName,
						height: element.getBoundingClientRect().height,
					}))
					.filter((element) => element.height > 0 && element.height < 44),
			);

		expect(undersized).toEqual([]);
	});
}
