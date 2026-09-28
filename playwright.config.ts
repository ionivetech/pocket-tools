import { defineConfig, devices } from "@playwright/test";

const port = 4173;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
	testDir: "./tests/e2e",
	testMatch: "**/*.pw.ts",
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: 0,
	reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
	use: {
		baseURL,
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
		serviceWorkers: "allow",
		// Chromium requires explicit clipboard-write permission in a headless/automated
		// context; without it the copy actions this repo's tools use (`ToolActions`, the
		// UUID generator's per-row copy) throw `NotAllowedError` even from a real click.
		permissions: ["clipboard-read", "clipboard-write"],
	},
	webServer: {
		command: `PORT=${port} bun .output/server/index.mjs`,
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		stdout: "ignore",
		stderr: "pipe",
		timeout: 120_000,
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
});
