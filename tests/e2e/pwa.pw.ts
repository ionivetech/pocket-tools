import { expect, test } from "@playwright/test";
import { waitForAppReady } from "./helpers/app";

test("registers the service worker and serves the cached shell offline", async ({
	page,
	context,
	request,
}) => {
	const manifestResponse = await request.get("/manifest.webmanifest");
	expect(manifestResponse.ok()).toBe(true);
	const manifest = (await manifestResponse.json()) as { icons?: Array<{ src: string }> };
	expect(manifest.icons?.map((icon) => icon.src)).toEqual(
		expect.arrayContaining(["/icon-192.png", "/icon-512.png", "/icon-maskable.svg"]),
	);

	await page.goto("/");
	await waitForAppReady(page);
	await page.evaluate(async () => {
		if (!("serviceWorker" in navigator)) throw new Error("Service workers are unavailable");
		await navigator.serviceWorker.ready;
	});
	await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, {
		timeout: 15_000,
	});
	await page.reload();
	await page.waitForLoadState("networkidle");
	await page.waitForFunction(
		async () => (await caches.keys()).includes("pockettools-pages"),
		undefined,
		{ timeout: 15_000 },
	);
	try {
		await context.setOffline(true);
		await page.reload({ waitUntil: "domcontentloaded" });
		await expect(page.getByRole("heading", { name: /Small tools/ })).toBeVisible();
		await expect(page.getByText("Offline mode")).toBeVisible();
	} finally {
		await context.setOffline(false);
	}
});

test("uses a precached fallback for an unvisited route in a fresh context", async ({
	browser,
	baseURL,
}) => {
	const freshContext = await browser.newContext({ baseURL, serviceWorkers: "allow" });
	const freshPage = await freshContext.newPage();
	try {
		await freshPage.goto("/");
		await freshPage.evaluate(async () => {
			await navigator.serviceWorker.ready;
		});
		await freshPage.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, {
			timeout: 15_000,
		});
		await freshContext.setOffline(true);
		const response = await freshPage.goto("/tools/never-visited?flow=8", {
			waitUntil: "domcontentloaded",
		});
		expect(response?.ok()).toBe(true);
		await expect(freshPage.getByRole("heading", { name: "You are offline." })).toBeVisible();
		await expect(freshPage.getByText(/PocketTools shell is still available/)).toBeVisible();
	} finally {
		await freshContext.close();
	}
});

test("keys the navigation cache by path, not by query string", async ({ page, context }) => {
	await page.goto("/");
	await waitForAppReady(page);
	await page.evaluate(async () => {
		await navigator.serviceWorker.ready;
	});
	await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, {
		timeout: 15_000,
	});

	// Two query variants of one path. `cacheKeyWillBeUsed` strips the search, so both
	// write the same key; without it they occupy two of the rule's twelve entries.
	await page.goto("/tools?category=Text");
	await waitForAppReady(page);
	await page.goto("/tools?category=Media");
	await waitForAppReady(page);

	const storedSearches = await page.evaluate(async () => {
		const cache = await caches.open("pockettools-pages");
		return (await cache.keys())
			.map((request) => new URL(request.url))
			.filter((url) => url.pathname === "/tools")
			.map((url) => url.search);
	});
	expect(storedSearches).toEqual([""]);

	try {
		await context.setOffline(true);
		// Never visited, and a different query string. With `ignoreSearch: true` the
		// lookup is a hit; without it the entry is a miss and the precached offline
		// page answers instead.
		await page.goto("/tools?category=Developer", { waitUntil: "domcontentloaded" });
		await waitForAppReady(page);
		await expect(page.getByRole("heading", { name: "All tools" })).toBeVisible();
		await expect(page.getByRole("heading", { name: "You are offline." })).toHaveCount(0);
	} finally {
		await context.setOffline(false);
	}
});

test("serves the baseline security headers", async ({ page }) => {
	const response = await page.goto("/");
	const headers = response?.headers() ?? {};
	expect(headers["x-frame-options"]).toBe("DENY");
	expect(headers["x-content-type-options"]).toBe("nosniff");
	expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
	expect(headers["permissions-policy"]).toContain("camera=()");
});
