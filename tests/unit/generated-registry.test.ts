import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
	generateToolRegistry,
	type GenerationErrorCode,
	type GenerationResult,
} from "../../scripts/generate-tool-registry";

const temporaryDirectories: string[] = [];
const scriptPath = resolve(
	dirname(fileURLToPath(import.meta.url)),
	"../../scripts/generate-tool-registry.ts",
);

type TestCase = Awaited<ReturnType<typeof createTestCase>>;

function createMetadata(slug: string) {
	return {
		slug,
		name: slug,
		description: `Use ${slug} locally.`,
		category: "Text",
		icon: "align-left",
		accent: "blue",
		keywords: [slug],
		componentPath: "~/components/ToolPlaceholder.vue",
	};
}

async function createTestCase() {
	const root = await mkdtemp(join(tmpdir(), "pocket-tools-registry-"));
	temporaryDirectories.push(root);

	const toolsRoot = join(root, "app", "tools");
	const registryOutput = join(root, "app", "data", "tool-registry.generated.ts");
	const routesOutput = join(root, "app", "data", "tool-routes.generated.ts");
	await Promise.all([
		mkdir(toolsRoot, { recursive: true }),
		mkdir(dirname(registryOutput), { recursive: true }),
	]);

	return { root, toolsRoot, registryOutput, routesOutput };
}

async function writeMetadataSource(testCase: TestCase, folder: string, source: string) {
	await mkdir(join(testCase.toolsRoot, folder), { recursive: true });
	await Bun.write(join(testCase.toolsRoot, folder, "metadata.ts"), source);
}

async function writeMetadata(testCase: TestCase, folder: string, slug: string) {
	await writeMetadataSource(
		testCase,
		folder,
		`export const toolMetadata = ${JSON.stringify(createMetadata(slug))};\n`,
	);
}

function expectGenerationFailure(result: GenerationResult, code: GenerationErrorCode) {
	if (result.ok) {
		throw new Error(`Expected generation to fail with ${code}`);
	}

	expect(result).toMatchObject({ definitionCount: 0, slugs: [], error: { code } });
}

afterEach(async () => {
	const directories = temporaryDirectories.splice(0);
	await Promise.all(
		directories.map((directory) => rm(directory, { force: true, recursive: true })),
	);
});

describe("generated tool registry", () => {
	test("discovers and emits four definitions in sorted slug order with lazy loaders", async () => {
		const testCase = await createTestCase();
		await Promise.all([
			writeMetadata(testCase, "folder-z", "zeta"),
			writeMetadata(testCase, "folder-a", "alpha"),
			writeMetadata(testCase, "folder-m", "mu"),
			writeMetadata(testCase, "folder-b", "beta"),
		]);

		const result = await generateToolRegistry(testCase);

		expect(result).toEqual({
			ok: true,
			definitionCount: 4,
			slugs: ["alpha", "beta", "mu", "zeta"],
		});
		expect(await Bun.file(testCase.registryOutput).text()).toBe(
			[
				'import type { ToolDefinition } from "../types/tool";',
				'import { toolMetadata as toolMetadata0 } from "../tools/folder-a/metadata";',
				'import { toolMetadata as toolMetadata1 } from "../tools/folder-b/metadata";',
				'import { toolMetadata as toolMetadata2 } from "../tools/folder-m/metadata";',
				'import { toolMetadata as toolMetadata3 } from "../tools/folder-z/metadata";',
				"",
				"export const generatedToolDefinitions: ToolDefinition[] = [",
				"\t{",
				"\t\t...toolMetadata0,",
				'\t\tloadComponent: () => import("~/components/ToolPlaceholder.vue"),',
				"\t},",
				"\t{",
				"\t\t...toolMetadata1,",
				'\t\tloadComponent: () => import("~/components/ToolPlaceholder.vue"),',
				"\t},",
				"\t{",
				"\t\t...toolMetadata2,",
				'\t\tloadComponent: () => import("~/components/ToolPlaceholder.vue"),',
				"\t},",
				"\t{",
				"\t\t...toolMetadata3,",
				'\t\tloadComponent: () => import("~/components/ToolPlaceholder.vue"),',
				"\t},",
				"];",
				"",
			].join("\n"),
		);
		expect(await Bun.file(testCase.routesOutput).text()).toBe(
			[
				"export const generatedToolSlugs = [",
				'\t"alpha",',
				'\t"beta",',
				'\t"mu",',
				'\t"zeta",',
				"] as const;",
				"",
			].join("\n"),
		);
	});

	test("rejects an empty tools root", async () => {
		const testCase = await createTestCase();
		expectGenerationFailure(await generateToolRegistry(testCase), "no_tool_sources");
	});

	test("rejects duplicate slugs before writing", async () => {
		const testCase = await createTestCase();
		await Promise.all([
			writeMetadata(testCase, "first", "same-slug"),
			writeMetadata(testCase, "second", "same-slug"),
		]);

		expectGenerationFailure(await generateToolRegistry(testCase), "duplicate_tool_slug");
		expect(await Bun.file(testCase.registryOutput).exists()).toBe(false);
		expect(await Bun.file(testCase.routesOutput).exists()).toBe(false);
	});

	test("rejects a metadata module without toolMetadata", async () => {
		const testCase = await createTestCase();
		await writeMetadataSource(testCase, "missing", "export const otherMetadata = {};\n");

		expectGenerationFailure(await generateToolRegistry(testCase), "invalid_tool_metadata");
	});

	test("rejects invalid tool metadata", async () => {
		const testCase = await createTestCase();
		await writeMetadataSource(
			testCase,
			"invalid",
			'export const toolMetadata = { slug: "INVALID" };\n',
		);

		expectGenerationFailure(await generateToolRegistry(testCase), "invalid_tool_metadata");
	});

	test("normalizes generation and write failures", async () => {
		const testCase = await createTestCase();
		await writeMetadata(testCase, "valid", "valid-tool");
		await mkdir(testCase.routesOutput, { recursive: true });

		expectGenerationFailure(await generateToolRegistry(testCase), "registry_generation_failed");
	});

	test("--check reports stale output without writing", async () => {
		const testCase = await createTestCase();
		await writeMetadata(testCase, "valid", "valid-tool");
		const staleRegistry = "export const generatedToolDefinitions = [];\n";
		const staleRoutes = "export const generatedToolSlugs = [] as const;\n";
		await Bun.write(testCase.registryOutput, staleRegistry);
		await Bun.write(testCase.routesOutput, staleRoutes);

		const child = Bun.spawn([process.execPath, scriptPath, "--check"], {
			cwd: testCase.root,
			stdout: "pipe",
			stderr: "pipe",
		});
		const [stdout, stderr, exitCode] = await Promise.all([
			new Response(child.stdout).text(),
			new Response(child.stderr).text(),
			child.exited,
		]);

		expect(exitCode).not.toBe(0);
		expect(`${stdout}${stderr}`).toContain("registry_generation_failed");
		expect(`${stdout}${stderr}`).toContain("stale");
		expect(await Bun.file(testCase.registryOutput).text()).toBe(staleRegistry);
		expect(await Bun.file(testCase.routesOutput).text()).toBe(staleRoutes);
	});
});
