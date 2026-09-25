import { expect, test } from "@playwright/test";

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
	await expect(page.locator('[data-app-ready="true"]')).toBeVisible();
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
