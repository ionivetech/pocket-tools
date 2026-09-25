import { defineConfig, devices } from "@playwright/test";

const port = 4173;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
	testDir: "./tests/e2e",
	testMatch: "**/*.pw.ts",
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 1 : 0,
	reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
	use: {
		baseURL,
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
		serviceWorkers: "allow",
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
