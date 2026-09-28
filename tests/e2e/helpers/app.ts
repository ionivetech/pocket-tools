import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

const appReady = '[data-app-ready="true"]';
const toolReady = '[data-testid="tool-host"][data-tool-ready="true"]';
const toolDetailPath = /^\/tools\/[^/]+\/?$/;

/**
 * Waits for the shell marker the app sets on mount, and on a tool detail page
 * also for `data-tool-ready`. Tool pages are prerendered: their controls exist
 * in the HTML before the tool's lazy chunk mounts, so a click (or a read of
 * client-rendered markup) in that window hits content Vue is about to replace.
 * @example `await waitForAppReady(page);`
 */
export async function waitForAppReady(page: Page) {
	await expect(page.locator(appReady)).toBeVisible();
	if (toolDetailPath.test(new URL(page.url()).pathname)) {
		await expect(page.locator(toolReady)).toBeAttached({ timeout: 20_000 });
	}
}

/**
 * Navigates to `path` and waits for the app — and, on a tool detail page, the
 * real tool component — to be interactive.
 * @example `await gotoAppReady(page, "/tools/json-formatter");`
 */
export async function gotoAppReady(page: Page, path: string) {
	await page.goto(path, { timeout: 20_000 });
	await waitForAppReady(page);
}

/**
 * Waits for a CodeMirror editor's content element, then reads it. CodeMirror
 * creates that element only when its view is built — in the tool component's
 * `onMounted`, after a dynamic import — so a cold machine can be a tick behind
 * the tool being ready, and reading before it exists silently yields "".
 * @example `await editorText(page, "json-formatter-input");`
 */
export async function editorText(page: Page, testid: string): Promise<string> {
	const content = page.locator(`[data-testid="${testid}"]`);
	await expect(content).toBeAttached({ timeout: 20_000 });
	const lines = await content.locator(".cm-line").allTextContents();
	return lines.join("\n");
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
