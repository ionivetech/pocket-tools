import { expect, test, type Page } from "@playwright/test";

const javascriptBudgetBytes = 120 * 1024;
const cssBudgetBytes = 30 * 1024;
const lazyToolMarker = "This tool is not available yet.";

async function waitForApp(page: Page) {
	await expect(page.locator('[data-app-ready="true"]')).toBeVisible();
}

test.describe("Phase 1 tool infrastructure", () => {
	test("collection search and category filters work at 375px", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 812 });
		await page.goto("/tools");
		await waitForApp(page);

		const search = page.getByRole("textbox", { name: "Search the tool library" });
		await search.fill("JSON");
		await page.getByRole("button", { name: "Search", exact: true }).click();
		await expect(page.getByTestId("tools-results")).toContainText("JSON formatter");
		await expect(page.getByRole("heading", { name: "Password generator" })).toHaveCount(0);

		await search.fill("");
		await page.getByRole("button", { name: "Developer", exact: true }).click();
		await expect(page.getByRole("heading", { name: "JSON formatter" })).toBeVisible();
		await expect(page.getByRole("heading", { name: "Color picker" })).toHaveCount(0);

		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth > window.innerWidth,
		);
		expect(overflow).toBe(false);
	});

	test("detail renders its lazy local placeholder", async ({ context, page }) => {
		let releaseChunk = () => {};
		const chunkGate = new Promise<void>((resolve) => {
			releaseChunk = resolve;
		});
		let markChunkRequested = () => {};
		const chunkRequested = new Promise<void>((resolve) => {
			markChunkRequested = resolve;
		});
		await context.route("**/_nuxt/*.js", async (route) => {
			const response = await route.fetch();
			const body = await response.text();
			if (body.includes(lazyToolMarker)) {
				markChunkRequested();
				await chunkGate;
			}
			await route.fulfill({ response });
		});

		await page.goto("/tools");
		await waitForApp(page);
		const jsonCard = page
			.getByRole("article")
			.filter({ has: page.getByRole("heading", { name: "JSON formatter" }) });
		const navigation = jsonCard.getByRole("link", { name: "Open tool" }).click();
		try {
			await chunkRequested;
			await expect(page.getByTestId("tool-state")).toHaveAttribute("data-kind", "loading");
			await expect(page.getByTestId("tool-placeholder")).toHaveCount(0);
		} finally {
			releaseChunk();
		}
		await navigation;
		await waitForApp(page);

		await expect(page.getByTestId("tool-placeholder")).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "This tool is not available yet." }),
		).toBeVisible();
	});

	test("an unknown slug returns a useful 404 with recovery", async ({ page }) => {
		const response = await page.goto("/tools/not-a-real-tool");
		expect(response?.status()).toBe(404);
		await expect(page.getByTestId("route-error-state")).toBeVisible();
		await expect(page.getByRole("heading", { name: "We could not find that page." })).toBeVisible();
		await expect(page.getByText(/Browse the tool collection or go back/)).toBeVisible();

		await page.getByRole("button", { name: "Browse tools" }).click();
		await expect(page).toHaveURL(/\/tools$/);
		await expect(page.getByRole("heading", { name: "All tools" })).toBeVisible();
	});

	test("collection search and result focus are keyboard reachable", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 812 });
		await page.goto("/tools");
		await waitForApp(page);

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
		await page.goto("/");
		await waitForApp(page);

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
		await context.route("**/_nuxt/*.js", async (route) => {
			const response = await route.fetch();
			const body = await response.text();
			if (!body.includes(lazyToolMarker)) {
				await route.fulfill({ response });
				return;
			}
			if (failNextRequest) {
				failNextRequest = false;
				await route.abort("failed");
				return;
			}
			await route.fulfill({ response });
		});

		await page.goto("/tools/json-formatter");
		await waitForApp(page);

		const errorState = page.getByRole("alert").filter({ hasText: "This tool could not open" });
		await expect(errorState).toBeVisible();
		await expect(page.getByTestId("tool-header")).toBeVisible();
		await expect(page.getByRole("contentinfo")).toBeVisible();
		await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
	});

	test("home stays within the initial JavaScript and CSS budgets", async ({ page }) => {
		await page.goto("/", { waitUntil: "networkidle" });
		await waitForApp(page);

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
