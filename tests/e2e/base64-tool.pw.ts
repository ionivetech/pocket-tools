import { expect, test } from "@playwright/test";
import {
	expectNoHorizontalOverflow,
	expectNoSeriousAxeViolations,
	expectTouchTargetsAtLeast44,
	gotoAppReady,
	openToolOptions,
} from "./helpers/app";

test.describe("Base64 encoder/decoder", () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test("auto-detects encode for plain text", async ({ page }) => {
		await gotoAppReady(page, "/tools/base64-tool");
		await page.getByTestId("base64-input").fill("hello world");
		await expect(page.getByTestId("base64-output")).toHaveValue("aGVsbG8gd29ybGQ=");
		await expect(page.getByTestId("base64-status")).toContainText("Encoded to base64.");
	});

	test("auto-detects decode for a base64 payload", async ({ page }) => {
		await gotoAppReady(page, "/tools/base64-tool");
		await page.getByTestId("base64-input").fill("aGVsbG8gd29ybGQ=");
		await expect(page.getByTestId("base64-output")).toHaveValue("hello world");
		await expect(page.getByTestId("base64-status")).toContainText("Decoded from base64.");
	});

	test("lets the user force a direction", async ({ page }) => {
		await gotoAppReady(page, "/tools/base64-tool");
		await openToolOptions(page);
		await page.getByTestId("base64-direction").click();
		await page.getByRole("option", { name: "Encode" }).click();
		await page.getByTestId("base64-input").fill("aGVsbG8=");
		await expect(page.getByTestId("base64-status")).toContainText("Encoded to base64.");
	});

	test("encodes URL-safe and wraps long output", async ({ page }) => {
		await gotoAppReady(page, "/tools/base64-tool");

		await openToolOptions(page);
		await page.getByTestId("base64-url-safe").click();
		await page.getByTestId("base64-input").fill("hello?");
		await expect(page.getByTestId("base64-output")).toHaveValue("aGVsbG8_");

		const longText = "a".repeat(50);
		const raw = Buffer.from(longText).toString("base64");
		await page.getByTestId("base64-url-safe").click();
		await page.getByTestId("base64-wrap").click();
		await page.getByRole("option", { name: "Wrap at 64" }).click();
		await page.getByTestId("base64-input").fill(longText);
		await expect(page.getByTestId("base64-output")).toHaveValue(
			`${raw.slice(0, 64)}\n${raw.slice(64)}`,
		);
	});

	test("encodes a dropped file to base64", async ({ page }) => {
		await gotoAppReady(page, "/tools/base64-tool");
		const fileChooserPromise = page.waitForEvent("filechooser");
		await page.getByTestId("tool-file-choose").click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles({
			name: "hello.txt",
			mimeType: "text/plain",
			buffer: Buffer.from("hello world"),
		});
		await expect(page.getByTestId("base64-output")).toHaveValue("aGVsbG8gd29ybGQ=");
	});

	test("has no serious axe violations and keeps touch targets at 44px", async ({ page }) => {
		await gotoAppReady(page, "/tools/base64-tool");
		await expectNoSeriousAxeViolations(page);
		await expectTouchTargetsAtLeast44(page);
		await expectNoHorizontalOverflow(page, "375px base64-tool");
	});
});
