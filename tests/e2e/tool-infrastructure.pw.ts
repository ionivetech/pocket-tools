import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, gotoAppReady, waitForAppReady } from "./helpers/app";
import { createChunkGate, interceptLazyChunk } from "./helpers/chunk";

const javascriptBudgetBytes = 120 * 1024;
const cssBudgetBytes = 30 * 1024;
const lazyToolMarker = "This tool is not available yet.";
const routeTimeout = 20_000;

test.describe("Phase 1 tool infrastructure", () => {
	test("collection search and category filters work at 375px", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 812 });
		await gotoAppReady(page, "/tools");

		const search = page.getByRole("textbox", { name: "Search the tool library" });
		await search.fill("JSON");
		await page.getByRole("button", { name: "Search", exact: true }).click();
		await expect(page.getByTestId("tools-results")).toContainText("JSON formatter");
		await expect(page.getByRole("heading", { name: "Password generator" })).toHaveCount(0);

		await search.fill("");
		await page.getByRole("button", { name: "Developer", exact: true }).click();
		await expect(page.getByRole("heading", { name: "JSON formatter" })).toBeVisible();
		await expect(page.getByRole("heading", { name: "Color picker" })).toHaveCount(0);

		await expectNoHorizontalOverflow(page, "375px tool collection");
	});

	test("detail renders its lazy local placeholder", async ({ context, page }) => {
		const chunkGate = createChunkGate(routeTimeout);
		interceptLazyChunk(context, lazyToolMarker, async (chunk, route) => {
			chunkGate.markIntercepted();
			await chunkGate.opened;
			await route.fulfill(chunk);
		});

		await gotoAppReady(page, "/tools");
		const jsonCard = page
			.getByRole("article")
			.filter({ has: page.getByRole("heading", { name: "JSON formatter" }) });
		const navigation = jsonCard.getByRole("link", { name: "Open tool" }).click();
		// The click outlives this block while the chunk is held; keep it from rejecting on teardown.
		navigation.catch(() => {});
		try {
			await chunkGate.intercepted;
			await expect(page.getByTestId("tool-state")).toHaveAttribute("data-kind", "loading");
			await expect(page.getByTestId("tool-placeholder")).toHaveCount(0);
		} finally {
			chunkGate.release();
		}
		await navigation;
		await waitForAppReady(page);

		await expect(page.getByTestId("tool-placeholder")).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "This tool is not available yet." }),
		).toBeVisible();
	});

	test("an unknown slug returns a useful 404 with recovery", async ({ page }) => {
		const notFound = page.waitForResponse(
			(response) => new URL(response.url()).pathname === "/tools/not-a-real-tool",
			{ timeout: routeTimeout },
		);
		// Commit on the response headers: the error page never finishes loading under worker load.
		await page.goto("/tools/not-a-real-tool", { waitUntil: "commit", timeout: routeTimeout });
		expect((await notFound).status()).toBe(404);
		await expect(page).toHaveURL(/\/tools\/not-a-real-tool$/, { timeout: routeTimeout });
		await expect(page.getByTestId("route-error-state")).toBeVisible({ timeout: routeTimeout });
		await expect(page.getByRole("heading", { name: "We could not find that page." })).toBeVisible();
		await expect(page.getByText(/Browse the tool collection or go back/)).toBeVisible();

		await page.getByRole("button", { name: "Browse tools" }).click();
		await expect(page).toHaveURL(/\/tools$/, { timeout: routeTimeout });
		await expect(page.getByRole("heading", { name: "All tools" })).toBeVisible();
	});

	test("collection search and result focus are keyboard reachable", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 812 });
		await gotoAppReady(page, "/tools");

		const search = page.getByRole("textbox", { name: "Search the tool library" });
		await search.focus();
		await page.keyboard.press("Shift+Tab");
		await page.keyboard.press("Tab");
		await expect(search).toBeFocused();
		await page.keyboard.type("JSON");
		await page.keyboard.press("Tab");

		const submit = page.getByRole("button", { name: "Search", exact: true });
		await expect(submit).toBeFocused();
		await page.keyboard.press("Enter");
		await expect(page.getByRole("region", { name: "All tools" })).toBeFocused();
		await expect(page.getByRole("heading", { name: "JSON formatter" })).toBeVisible();
	});

	test("reduced motion suppresses running and scheduled motion", async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "reduce" });
		await gotoAppReady(page, "/");

		await expect
			.poll(() =>
				page.evaluate(
					() =>
						document.getAnimations().filter((animation) => animation.playState === "running")
							.length,
				),
			)
			.toBe(0);

		const longestDuration = await page.locator("body *").evaluateAll((elements) => {
			const durations = elements.flatMap((element) => {
				const styles = getComputedStyle(element);
				return [styles.animationDuration, styles.transitionDuration];
			});
			return Math.max(
				0,
				...durations.flatMap((duration) =>
					duration.split(",").map((entry) => {
						const value = entry.trim();
						const amount = Number.parseFloat(value);
						return value.endsWith("ms") ? amount : amount * 1000;
					}),
				),
			);
		});
		expect(longestDuration).toBeLessThanOrEqual(0.01);
	});

	test("a local tool failure preserves the shell and offers retry", async ({ context, page }) => {
		let failNextRequest = true;
		interceptLazyChunk(context, lazyToolMarker, async (chunk, route) => {
			if (!failNextRequest) {
				await route.fulfill(chunk);
				return;
			}
			failNextRequest = false;
			await route.abort("failed");
		});

		await gotoAppReady(page, "/tools/json-formatter");

		const errorState = page.getByRole("alert").filter({ hasText: "This tool could not open" });
		await expect(errorState).toBeVisible();
		await expect(page.getByTestId("tool-header")).toBeVisible();
		await expect(page.getByRole("contentinfo")).toBeVisible();
		await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
	});

	test("home stays within the initial JavaScript and CSS budgets", async ({ page }) => {
		await page.goto("/", { waitUntil: "networkidle" });
		await waitForAppReady(page);

		const { loadEnd, resources } = await page.evaluate(() => {
			const loadEnd = performance.getEntriesByType("navigation")[0]?.loadEventEnd ?? 0;
			return {
				loadEnd,
				resources: performance.getEntriesByType("resource").map((entry) => ({
					name: entry.name,
					startTime: entry.startTime,
					transferSize: entry.transferSize,
					encodedBodySize: entry.encodedBodySize,
				})),
			};
		});
		const initialResourceNames = new Set<string>();
		const initialResources = resources.filter((resource) => {
			if (resource.startTime > loadEnd) return false;
			if (initialResourceNames.has(resource.name)) return false;
			initialResourceNames.add(resource.name);
			return true;
		});
		const initialJavaScript = initialResources.filter((resource) =>
			new URL(resource.name).pathname.endsWith(".js"),
		);
		const initialCss = initialResources.filter((resource) =>
			new URL(resource.name).pathname.endsWith(".css"),
		);
		const bytes = (resources: typeof initialJavaScript) =>
			resources.reduce(
				(total, resource) =>
					total + (resource.transferSize === 0 ? resource.encodedBodySize : resource.transferSize),
				0,
			);
		const javascriptBytes = bytes(initialJavaScript);
		const cssBytes = bytes(initialCss);

		expect(initialJavaScript.length).toBeGreaterThan(0);
		expect(initialCss.length).toBeGreaterThan(0);
		expect(javascriptBytes).toBeLessThanOrEqual(javascriptBudgetBytes);
		expect(cssBytes).toBeLessThanOrEqual(cssBudgetBytes);
	});
});
