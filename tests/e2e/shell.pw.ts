import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, gotoAppReady } from "./helpers/app";

const evidenceDir = ".mugiwara/missions/pockettools-phase1-core-infrastructure/evidence";

test.describe("Phase 0 shell", () => {
	test("home search filters the launcher collection", async ({ page }) => {
		await gotoAppReady(page, "/");
		await expect(page.getByRole("heading", { name: /Small tools/ })).toBeVisible();

		const search = page.getByLabel("Search tools");
		await search.fill("password");
		await page.getByRole("button", { name: "Find a tool" }).click();
		await expect(page.getByRole("region", { name: "Start with something useful." })).toBeFocused();
		await expect(page.getByRole("heading", { name: "Password generator" })).toBeVisible();
		await expect(page.getByRole("heading", { name: "JSON formatter" })).toHaveCount(0);
		await expect(page.getByText("⌘ K")).toHaveCount(0);
		await expect(page.getByRole("link", { name: /JSON formatter/ }).first()).toBeVisible();
	});

	test("tools route supports categories and a real empty state", async ({ page }) => {
		await gotoAppReady(page, "/tools");
		await page.getByRole("button", { name: "Developer", exact: true }).click();
		await expect(page.getByRole("heading", { name: "JSON formatter" })).toBeVisible();
		await expect(page.getByRole("heading", { name: "Password generator" })).toHaveCount(0);

		await page.getByLabel("Search the tool library").fill("not-a-real-tool");
		await expect(page.getByRole("heading", { name: "No shortcut found." })).toBeVisible();
		await page.getByRole("button", { name: "Clear filters" }).click();
		await expect(page.getByRole("heading", { name: "JSON formatter" })).toBeVisible();
	});

	test("tool detail renders registry metadata and the local placeholder", async ({ page }) => {
		// color-picker stays an unimplemented Phase 1 placeholder; json-formatter has a
		// real component as of Phase 2, so it can no longer stand in for "still lazy".
		await gotoAppReady(page, "/tools/color-picker");

		await expect(page.getByRole("heading", { level: 1, name: "Color picker" })).toBeVisible();
		await expect(page.getByTestId("tool-placeholder")).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "This tool is not available yet." }),
		).toBeVisible();
	});

	test("favorites and theme state persist in the browser", async ({ page }) => {
		await gotoAppReady(page, "/tools");
		await page.getByRole("button", { name: "Add Password generator to favorites" }).click();
		await page.getByRole("button", { name: /Favorites/ }).click();
		await expect(page.getByRole("button", { name: /Favorites/ })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		await expect(page.getByRole("heading", { name: "Password generator" })).toBeVisible();

		await gotoAppReady(page, "/");
		const themeToggle = page.getByRole("button", { name: "Dark theme" });
		await expect(themeToggle).toHaveAttribute("aria-pressed", "false");
		await themeToggle.click();
		await expect(themeToggle).toHaveAttribute("aria-pressed", "true");
		await expect(page.locator("html")).toHaveClass(/app-dark/);
	});

	test("applies a persisted theme before the app mounts", async ({ page }) => {
		await page.addInitScript(() => {
			window.localStorage.setItem("pockettools-theme", "dark");
		});
		await page.goto("/", { waitUntil: "domcontentloaded", timeout: 20_000 });
		await expect(page.locator("html")).toHaveClass(/app-dark/);
	});

	test("applies the system theme before the app mounts", async ({ page }) => {
		await page.emulateMedia({ colorScheme: "dark" });
		await page.goto("/", { waitUntil: "domcontentloaded", timeout: 20_000 });
		await expect(page.locator("html")).toHaveClass(/app-dark/);
	});

	test("opens the global quick-search palette and navigates", async ({ page }) => {
		await gotoAppReady(page, "/");
		await page.keyboard.press("Control+K");
		await expect(page.getByTestId("home-palette")).toBeVisible();
		await page.getByTestId("home-palette-input").fill("uuid");
		await page.getByTestId("home-palette-results").getByRole("option").first().click();
		await expect(page).toHaveURL(/\/tools\/uuid-generator/);
	});

	test("opens the palette from the header on any page", async ({ page }) => {
		await gotoAppReady(page, "/tools/json-formatter");
		await page.getByTestId("header-palette-trigger").click();
		await expect(page.getByTestId("home-palette-input")).toBeVisible();
		await page.keyboard.press("Escape");
		await expect(page.getByTestId("home-palette")).toHaveCount(0);
	});

	test("shows favorites first on the all-tools view", async ({ page }) => {
		await gotoAppReady(page, "/tools");
		await expect(page.getByTestId("tools-favorites-first")).toHaveCount(0);
		await page.getByRole("button", { name: "Add JSON formatter to favorites" }).click();
		await expect(page.getByTestId("tools-favorites-first")).toContainText("JSON formatter");
	});

	test("shows the palette as a centered dialog on desktop and a bottom sheet on mobile", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1440, height: 950 });
		await gotoAppReady(page, "/");
		await page.keyboard.press("Control+K");
		await expect(page.getByTestId("home-palette")).toBeVisible();

		const mask = page.locator(".p-dialog-mask");
		await expect(mask).toHaveCSS("align-items", "center");

		await page.setViewportSize({ width: 375, height: 812 });
		await expect(mask).toHaveCSS("align-items", "flex-end");
		// A bottom sheet is rounded at the top and flush with the viewport bottom.
		await expect(page.getByTestId("home-palette")).toHaveCSS("border-top-left-radius", "20px");
		await expect(page.getByTestId("home-palette")).toHaveCSS("border-bottom-left-radius", "0px");
	});

	test.describe("mobile navigation", () => {
		test.use({ viewport: { width: 375, height: 812 } });

		test("opens the drawer and reaches the collection", async ({ page }) => {
			await gotoAppReady(page, "/");
			await page.getByRole("button", { name: "Open navigation menu" }).click();
			await expect(page.getByRole("link", { name: /Browse tools/ })).toBeVisible();
			await page.getByRole("link", { name: /Browse tools/ }).click();
			await expect(page).toHaveURL(/\/tools$/);
		});
	});

	test("responsive layouts stay within the viewport", async ({ page }) => {
		await mkdir(evidenceDir, { recursive: true });
		for (const theme of ["light", "dark"] as const) {
			await page.emulateMedia({ colorScheme: theme });
			for (const width of [375, 768, 1440]) {
				await page.setViewportSize({ width, height: 900 });
				await gotoAppReady(page, "/");
				await expectNoHorizontalOverflow(
					page,
					`horizontal overflow at ${width}px in ${theme} theme`,
				);
				await page.screenshot({
					path: `${evidenceDir}/phase1-home-${width}-${theme}.png`,
					fullPage: true,
				});
			}
		}
	});
});
