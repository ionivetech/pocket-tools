import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import config from "../../playwright.config";

const testsRoot = resolve(import.meta.dir, "..");

async function scan(pattern: string): Promise<string[]> {
	const found: string[] = [];
	for await (const path of new Bun.Glob(pattern).scan({ cwd: testsRoot, onlyFiles: true })) {
		found.push(path);
	}
	return found.sort();
}

describe("browser test harness", () => {
	test("collects only *.pw.ts and keeps every browser test reachable", async () => {
		expect(config.testMatch).toBe("**/*.pw.ts");
		expect(await scan("**/*.spec.ts")).toEqual([]);
		expect(
			(await scan("e2e/**/*")).filter(
				(path) => !path.endsWith(".pw.ts") && !path.startsWith("e2e/helpers/"),
			),
		).toEqual([]);
	});
});
