import { describe, expect, test } from "bun:test";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

describe("direct TypeScript check", () => {
	test("passes without relying on vue-tsc", async () => {
		const child = Bun.spawn(["bunx", "tsc", "--noEmit"], {
			cwd: repositoryRoot,
			stdout: "pipe",
			stderr: "pipe",
		});
		const [exitCode, stdout, stderr] = await Promise.all([
			child.exited,
			new Response(child.stdout).text(),
			new Response(child.stderr).text(),
		]);

		if (exitCode !== 0) {
			throw new Error(`bunx tsc --noEmit failed with exit ${exitCode}:\n${stdout}${stderr}`);
		}

		expect(exitCode).toBe(0);
	});
});
