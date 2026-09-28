import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

const appReady = '[data-app-ready="true"]';
const toolReady = '[data-testid="tool-host"][data-tool-ready="true"]';

/** Waits for the shell marker that the app sets once it has mounted. @example `await waitForAppReady(page);` */
export function waitForAppReady(page: Page) {
	return expect(page.locator(appReady)).toBeVisible();
}

/**
 * Navigates to `path` and waits for the app to be ready. On a tool detail page
 * it also waits for `data-tool-ready`, because tool pages are prerendered: their
 * controls exist in the HTML before the tool's lazy chunk mounts, and a click in
 * that window lands on markup Vue is about to replace.
 * @example `await gotoAppReady(page, "/tools/json-formatter");`
 */
export async function gotoAppReady(page: Page, path: string) {
	await page.goto(path, { timeout: 20_000 });
	await waitForAppReady(page);
	if (/^\/tools\/[^/]+\/?$/.test(path)) {
		await expect(page.locator(toolReady)).toBeAttached({ timeout: 20_000 });
	}
}

/** Fails with `context` when the page scrolls sideways, which breaks use on a 375px phone. @example `await expectNoHorizontalOverflow(page, "375px light");` */
export async function expectNoHorizontalOverflow(page: Page, context: string) {
	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth > window.innerWidth,
	);
	expect(overflow, context).toBe(false);
}

/** Asserts that axe reports no critical or serious violation once animations have settled. @example `await expectNoSeriousAxeViolations(page);` */
export async function expectNoSeriousAxeViolations(page: Page) {
	await page.evaluate(async () => {
		await Promise.all(
			document.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
		);
	});
	const results = await new AxeBuilder({ page }).analyze();

	expect(
		results.violations.filter(
			(violation) => violation.impact === "critical" || violation.impact === "serious",
		),
	).toEqual([]);
}

/**
 * Asserts that every visible interactive control keeps the 44px touch target minimum.
 * `requireWidth` additionally checks the width for controls that must not be narrow.
 * @example `await expectTouchTargetsAtLeast44(page, { requireWidth: true });`
 */
export async function expectTouchTargetsAtLeast44(
	page: Page,
	options: { requireWidth?: boolean } = {},
) {
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
			options.requireWidth ?? false,
		);
	expect(undersized).toEqual([]);
}

/**
 * Opens the floating tool-options drawer when it is rendered (mobile widths
 * hide the inline toolbar behind it). A no-op on desktop, where the toolbar
 * is already visible. @example `await openToolOptions(page);`
 */
export async function openToolOptions(page: Page) {
	const fab = page.getByTestId("tool-options-fab");
	if (await fab.isVisible()) {
		await fab.click();
		await expect(page.getByTestId("tool-options-dialog")).toBeVisible();
	}
}
