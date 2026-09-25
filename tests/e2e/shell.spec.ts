import { expect, test, type Page } from "@playwright/test";

const evidenceDir = ".mugiwara/missions/pockettools-phase0-nuxt/evidence";

async function waitForApp(page: Page) {
	await expect(page.locator('[data-app-ready="true"]')).toBeVisible();
}

test.describe("Phase 0 shell", () => {
	test("home search filters the launcher collection", async ({ page }) => {
		await page.goto("/");
		await waitForApp(page);
		await expect(page.getByRole("heading", { name: /Small tools/ })).toBeVisible();

		const search = page.getByLabel("Search tools");
		await search.fill("password");
		await expect(page.getByRole("heading", { name: "Password generator" })).toBeVisible();
		await expect(page.getByRole("heading", { name: "JSON formatter" })).toHaveCount(0);
	});

	test("tools route supports categories and a real empty state", async ({ page }) => {
		await page.goto("/tools");
		await waitForApp(page);
		await page.getByRole("button", { name: "Developer", exact: true }).click();
		await expect(page.getByRole("heading", { name: "JSON formatter" })).toBeVisible();
		await expect(page.getByRole("heading", { name: "Password generator" })).toHaveCount(0);

		await page.getByLabel("Search the tool library").fill("not-a-real-tool");
		await expect(page.getByRole("heading", { name: "No shortcut found." })).toBeVisible();
		await page.getByRole("button", { name: "Clear filters" }).click();
		await expect(page.getByRole("heading", { name: "JSON formatter" })).toBeVisible();
	});

	test("favorites and theme state persist in the browser", async ({ page }) => {
		await page.goto("/tools");
		await waitForApp(page);
		await page.getByRole("button", { name: "Add Password generator to favorites" }).click();
		await page.getByRole("tab", { name: /Favorites/ }).click();
		await expect(page.getByRole("heading", { name: "Password generator" })).toBeVisible();

		await page.goto("/");
		await waitForApp(page);
		await page.getByRole("button", { name: "Switch to dark theme" }).click();
		await expect(page.locator("html")).toHaveClass(/app-dark/);
	});

	test.describe("mobile navigation", () => {
		test.use({ viewport: { width: 375, height: 812 } });

		test("opens the drawer and reaches the collection", async ({ page }) => {
			await page.goto("/");
			await waitForApp(page);
			await page.getByRole("button", { name: "Open navigation menu" }).click();
			await expect(page.getByRole("link", { name: /Browse tools/ })).toBeVisible();
			await page.getByRole("link", { name: /Browse tools/ }).click();
			await expect(page).toHaveURL(/\/tools$/);
		});
	});

	test("responsive layouts stay within the viewport", async ({ page }) => {
		for (const width of [375, 768, 1440]) {
			await page.setViewportSize({ width, height: 900 });
			await page.goto("/");
			await waitForApp(page);
			const overflow = await page.evaluate(
				() => document.documentElement.scrollWidth > window.innerWidth,
			);
			expect(overflow, `horizontal overflow at ${width}px`).toBe(false);
			await page.screenshot({ path: `${evidenceDir}/phase0-home-${width}.png`, fullPage: true });
		}
	});
});
