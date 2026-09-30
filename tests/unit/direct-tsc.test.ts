import { describe, expect, test } from "bun:test";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

describe("direct TypeScript check", () => {
	test(
		"passes without relying on vue-tsc",
		async () => {
			const child = Bun.spawn(["bunx", "tsc", "--noEmit"], {
				cwd: repositoryRoot,
				stdout: "pipe",
				stderr: "pipe",
			});

			try {
				const [exitCode, stdout, stderr] = await Promise.all([
					child.exited,
					new Response(child.stdout).text(),
					new Response(child.stderr).text(),
				]);

				if (exitCode !== 0) {
					throw new Error(`bunx tsc --noEmit failed with exit ${exitCode}:\n${stdout}${stderr}`);
				}

				expect(exitCode).toBe(0);
			} finally {
				if (child.exitCode === null) {
					child.kill();
					await child.exited;
				}
			}
		},
		// Measured 2026-09-30 (Phase 4, 20 tools): `bunx tsc --noEmit` takes
		// ~22.5 s on this tree, so the old 15 s budget failed on a green
		// compiler. Raised to 60 s: the check still fails on a real error, it
		// just no longer races the catalog size.
		{ timeout: 60_000 },
	);
});
