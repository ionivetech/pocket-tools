import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse } from "vue/compiler-sfc";
import { type Result, validateToolMetadata } from "../../app/types/tool";
import { generateToolRegistry } from "../../scripts/generate-tool-registry";
import {
	parseScaffoldArgs,
	scaffoldTool,
	type ScaffoldArgs,
	type ScaffoldErrorCode,
} from "../../scripts/scaffold-tool";

const generatedFileNames = [
	"ToolComponent.vue",
	"logic.test.ts",
	"logic.ts",
	"metadata.ts",
	"schema.ts",
] as const;

/** M-4 regression inputs: each one breaks a different generated surface. */
const hostileNames = [
	"*/ globalThis.__pwned = true; /*",
	"{{ 1 + 1 }}",
	"</h2><script>alert(1)</script>",
	'Say "hi" to `code`\nsecond line',
] as const;

const temporaryDirectories: string[] = [];

const scriptPath = resolve(
	dirname(fileURLToPath(import.meta.url)),
	"../../scripts/scaffold-tool.ts",
);

const generatorScriptPath = resolve(
	dirname(fileURLToPath(import.meta.url)),
	"../../scripts/generate-tool-registry.ts",
);

const transpiler = new Bun.Transpiler({ loader: "ts" });

const completeArguments = [
	"--slug",
	"word-count",
	"--name",
	"Word count",
	"--description",
	"Count words and characters in your text.",
	"--category",
	"Text",
	"--keywords",
	"words, count , characters",
];

function expectedArguments(outRoot: string): ScaffoldArgs {
	return {
		slug: "word-count",
		name: "Word count",
		description: "Count words and characters in your text.",
		category: "Text",
		keywords: ["words", "count", "characters"],
		outRoot,
	};
}

/** Every valid metadata field except `componentPath`, so a test can vary just that. */
function metadataWith(componentPath: string) {
	return {
		slug: "word-count",
		name: "Word count",
		description: "Count words and characters in your text.",
		category: "Text",
		icon: "sparkles",
		accent: "blue",
		keywords: ["words"],
		componentPath,
	};
}

/** Paths outside the two allowed shapes: traversal, escapes, remote and data: specifiers. */
const hostileComponentPaths = [
	"~/tools/../evil/ToolComponent.vue",
	"~/components/tools/word-count/ToolComponent.vue",
	"/etc/passwd",
	"~/tools/../../etc/passwd",
	"https://evil.example/ToolComponent.vue",
	"//evil.example/ToolComponent.vue",
	"data:text/javascript,export default {}",
	"~/tools/Word-Count/ToolComponent.vue",
	"~/tools/word.count/ToolComponent.vue",
	"~/tools/word-count/Component.vue",
] as const;

async function createOutRoot(): Promise<string> {
	const root = await mkdtemp(join(tmpdir(), "pocket-tools-scaffold-"));
	temporaryDirectories.push(root);
	return root;
}

async function parsedScaffoldArgs(outRoot: string): Promise<ScaffoldArgs> {
	const result = parseScaffoldArgs([...completeArguments, "--out-root", outRoot]);
	if (!result.ok) {
		throw new Error(`Expected arguments to parse: ${result.error.message}`);
	}
	return result.value;
}

function expectParseFailure(result: Result<ScaffoldArgs>, code: ScaffoldErrorCode): void {
	if (result.ok) {
		throw new Error(`Expected parse failure with ${code}`);
	}
	expect(result.error.code).toBe(code);
}

async function readToolDirectory(root: string, slug: string): Promise<string[]> {
	return (await readdir(join(root, "app", "tools", slug))).sort();
}

async function scaffoldInto(outRoot: string, overrides: Partial<ScaffoldArgs> = {}) {
	return scaffoldTool({ ...(await parsedScaffoldArgs(outRoot)), ...overrides });
}

function toolFile(outRoot: string, fileName: string): string {
	return join(outRoot, "app", "tools", "word-count", fileName);
}

async function generateRegistryFor(outRoot: string) {
	const registryOutput = join(outRoot, "app", "data", "tool-registry.generated.ts");
	const routesOutput = join(outRoot, "app", "data", "tool-routes.generated.ts");
	await mkdir(dirname(registryOutput), { recursive: true });
	const result = await generateToolRegistry({
		toolsRoot: join(outRoot, "app", "tools"),
		registryOutput,
		routesOutput,
	});
	return { registryOutput, result, routesOutput };
}

/** Runs the real `generate:registry --check` gate against a temporary root. */
async function checkRegistryFor(outRoot: string) {
	const child = Bun.spawn([process.execPath, generatorScriptPath, "--check"], {
		cwd: outRoot,
		stdout: "pipe",
		stderr: "pipe",
	});
	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(child.stdout).text(),
		new Response(child.stderr).text(),
		child.exited,
	]);
	return { exitCode, output: `${stdout}${stderr}` };
}

afterEach(async () => {
	const directories = temporaryDirectories.splice(0);
	await Promise.all(
		directories.map((directory) => rm(directory, { force: true, recursive: true })),
	);
});

describe("parseScaffoldArgs", () => {
	test("parses every flag and splits comma-separated keywords", () => {
		const outRoot = "/tmp/pocket-tools-scaffold-example";
		const result = parseScaffoldArgs([...completeArguments, "--out-root", outRoot]);

		expect(result).toEqual({ ok: true, value: expectedArguments(outRoot) });
	});

	test("defaults the output root and the keyword list", () => {
		const result = parseScaffoldArgs([
			"--slug",
			"word-count",
			"--name",
			"Word count",
			"--description",
			"Count words and characters in your text.",
			"--category",
			"Text",
		]);

		expect(result).toEqual({
			ok: true,
			value: { ...expectedArguments("."), keywords: ["word-count"] },
		});
	});

	test("rejects slugs that are not strict lowercase kebab-case", () => {
		for (const slug of ["Word-Count", "word_count", "-word", "word-", "../evil", ""]) {
			expectParseFailure(
				parseScaffoldArgs([
					"--slug",
					slug,
					"--name",
					"Word count",
					"--description",
					"Count words and characters in your text.",
					"--category",
					"Text",
				]),
				"invalid_slug",
			);
		}
		expectParseFailure(parseScaffoldArgs([]), "invalid_slug");
	});

	test("reports a missing name and a missing description separately", () => {
		expectParseFailure(
			parseScaffoldArgs([
				"--slug",
				"word-count",
				"--name",
				"   ",
				"--description",
				"Count words and characters in your text.",
				"--category",
				"Text",
			]),
			"missing_name",
		);
		expectParseFailure(
			parseScaffoldArgs([
				"--slug",
				"word-count",
				"--name",
				"Word count",
				"--description",
				"  ",
				"--category",
				"Text",
			]),
			"missing_description",
		);
	});

	test("rejects a missing or unsupported category", () => {
		for (const category of ["Unknown", "All", ""]) {
			expectParseFailure(
				parseScaffoldArgs([
					"--slug",
					"word-count",
					"--name",
					"Word count",
					"--description",
					"Count words and characters in your text.",
					"--category",
					category,
				]),
				"invalid_category",
			);
		}
		expectParseFailure(
			parseScaffoldArgs([
				"--slug",
				"word-count",
				"--name",
				"Word count",
				"--description",
				"Count words and characters in your text.",
			]),
			"invalid_category",
		);
	});

	test("rejects an empty keyword list", () => {
		const withoutKeywords = completeArguments.filter(
			(_, index) =>
				completeArguments[index - 1] !== "--keywords" && completeArguments[index] !== "--keywords",
		);
		expectParseFailure(
			parseScaffoldArgs([...withoutKeywords, "--keywords", " , "]),
			"invalid_keywords",
		);
	});

	test("rejects unknown flags, duplicate flags, and missing values", () => {
		expectParseFailure(
			parseScaffoldArgs([...completeArguments, "--force", "true"]),
			"invalid_arguments",
		);
		expectParseFailure(
			parseScaffoldArgs([...completeArguments, "--name", "Second name"]),
			"invalid_arguments",
		);
		expectParseFailure(
			parseScaffoldArgs([...completeArguments, "--out-root"]),
			"invalid_arguments",
		);
	});

	test("rejects an output root that tries to escape with a parent segment", () => {
		expectParseFailure(
			parseScaffoldArgs([...completeArguments, "--out-root", "../escape"]),
			"invalid_arguments",
		);
		expectParseFailure(
			parseScaffoldArgs([...completeArguments, "--out-root", "/tmp/tools/../../escape"]),
			"invalid_arguments",
		);
	});
});

describe("scaffoldTool", () => {
	test("writes exactly five stub files under app/tools/<slug>", async () => {
		const outRoot = await createOutRoot();
		const result = await scaffoldTool(await parsedScaffoldArgs(outRoot));

		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}

		expect([...result.value.files].sort()).toEqual([...generatedFileNames]);
		expect(result.value.directory).toBe(join(outRoot, "app", "tools", "word-count"));
		expect(await readToolDirectory(outRoot, "word-count")).toEqual([...generatedFileNames]);
	});

	test("generates metadata that the T1 validator accepts", async () => {
		const outRoot = await createOutRoot();
		await scaffoldTool(await parsedScaffoldArgs(outRoot));
		const metadataPath = join(outRoot, "app", "tools", "word-count", "metadata.ts");
		const imported = (await import(pathToFileURL(metadataPath).href)) as {
			readonly toolMetadata?: unknown;
		};
		const validation = validateToolMetadata(imported.toolMetadata);

		expect(validation).toMatchObject({
			ok: true,
			value: {
				slug: "word-count",
				name: "Word count",
				description: "Count words and characters in your text.",
				category: "Text",
				keywords: ["words", "count", "characters"],
				componentPath: "~/tools/word-count/ToolComponent.vue",
			},
		});
		expect(validation.ok && validation.value.componentPath).toBe(
			"~/tools/word-count/ToolComponent.vue",
		);
	});

	test("accepts the per-tool component path and reports it in the notes", async () => {
		const outRoot = await createOutRoot();
		const result = await scaffoldTool(await parsedScaffoldArgs(outRoot));

		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}

		expect(result.value.componentPath).toBe("~/tools/word-count/ToolComponent.vue");
		expect(validateToolMetadata(metadataWith("~/tools/word-count/ToolComponent.vue")).ok).toBe(
			true,
		);
		expect(validateToolMetadata(metadataWith("~/components/ToolPlaceholder.vue")).ok).toBe(true);
		expect(result.value.notes.join(" ")).toContain("~/tools/word-count/ToolComponent.vue");
	});

	test("still refuses every component path outside the two allowed shapes", async () => {
		const outRoot = await createOutRoot();
		expect((await scaffoldTool(await parsedScaffoldArgs(outRoot))).ok).toBe(true);

		for (const componentPath of hostileComponentPaths) {
			const validation = validateToolMetadata(metadataWith(componentPath));

			if (validation.ok) {
				throw new Error(`Expected ${componentPath} to be rejected`);
			}

			expect(validation.error.code).toBe("invalid_tool_component_path");
		}
	});

	test("generates stubs with no tool algorithm, style literals, or fake success", async () => {
		const outRoot = await createOutRoot();
		await scaffoldTool(await parsedScaffoldArgs(outRoot));
		const directory = join(outRoot, "app", "tools", "word-count");
		const contents = await Promise.all(
			generatedFileNames.map((name) => Bun.file(join(directory, name)).text()),
		);
		const [component, logicTest, logic, metadata, schema] = contents as [
			string,
			string,
			string,
			string,
			string,
		];

		expect(metadata).toContain('slug: "word-count"');
		expect(logic).toContain("not_implemented");
		expect(logic).not.toContain("ok: true");
		expect(schema).toContain("invalid_input");
		expect(component).toContain("pt-empty");
		expect(component).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
		expect(component).not.toMatch(/\b\d+px\b/);
		expect(logicTest).toContain('from "bun:test"');
		expect(`${contents.join("\n")}`).not.toContain("http://");
	});

	test("feeds the T2 generator from the temporary root", async () => {
		const outRoot = await createOutRoot();
		await scaffoldTool(await parsedScaffoldArgs(outRoot));
		const registryOutput = join(outRoot, "app", "data", "tool-registry.generated.ts");
		const routesOutput = join(outRoot, "app", "data", "tool-routes.generated.ts");
		await mkdir(dirname(registryOutput), { recursive: true });

		const generated = await generateToolRegistry({
			toolsRoot: join(outRoot, "app", "tools"),
			registryOutput,
			routesOutput,
		});

		expect(generated).toEqual({
			ok: true,
			definitionCount: 1,
			slugs: ["word-count"],
		});
		expect(await Bun.file(routesOutput).text()).toContain('"word-count"');
	});

	test("refuses to overwrite an existing tool", async () => {
		const outRoot = await createOutRoot();
		const args = await parsedScaffoldArgs(outRoot);
		await scaffoldTool(args);
		const logicPath = join(outRoot, "app", "tools", "word-count", "logic.ts");
		const original = await Bun.file(logicPath).text();

		const second = await scaffoldTool(args);

		expect(second.ok).toBe(false);
		if (!second.ok) {
			expect(second.error.code).toBe("existing_tool");
		}
		expect(await Bun.file(logicPath).text()).toBe(original);
		expect(await readToolDirectory(outRoot, "word-count")).toEqual([...generatedFileNames]);
	});

	test("reports a write failure when the output root is not a directory", async () => {
		const outRoot = await createOutRoot();
		const fileRoot = join(outRoot, "not-a-directory");
		await writeFile(fileRoot, "occupied\n");

		const result = await scaffoldTool({
			...(await parsedScaffoldArgs(outRoot)),
			outRoot: fileRoot,
		});

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("write_failed");
		}
		expect(await readdir(outRoot)).toEqual(["not-a-directory"]);
	});
});

describe("hostile --name", () => {
	for (const name of hostileNames) {
		test(`keeps generated TypeScript inert for ${JSON.stringify(name)}`, async () => {
			const outRoot = await createOutRoot();
			await scaffoldInto(outRoot, { name });
			const generatedTypeScript = ["metadata.ts", "schema.ts", "logic.ts", "logic.test.ts"];

			for (const fileName of generatedTypeScript) {
				const code = await Bun.file(toolFile(outRoot, fileName)).text();
				expect(() => transpiler.transformSync(code)).not.toThrow();
			}
			// A `*/` break-out transpiles without complaint and lands as a top-level
			// statement, so the guard has to be the executed result, not the parse.
			delete (globalThis as Record<string, unknown>).__pwned;
			try {
				for (const fileName of ["metadata.ts", "schema.ts", "logic.ts"]) {
					await import(pathToFileURL(toolFile(outRoot, fileName)).href);
				}
				expect((globalThis as Record<string, unknown>).__pwned).toBeUndefined();
			} finally {
				delete (globalThis as Record<string, unknown>).__pwned;
			}
			// schema.ts interpolated the name in exactly one place: the JSDoc.
			expect(await Bun.file(toolFile(outRoot, "schema.ts")).text()).not.toContain(name);
			expect(await Bun.file(toolFile(outRoot, "logic.ts")).text()).toContain(
				" * Empty-state contract for this tool.",
			);
		});

		test(`binds ${JSON.stringify(name)} into an inert script literal`, async () => {
			const outRoot = await createOutRoot();
			await scaffoldInto(outRoot, { name });
			const component = await Bun.file(toolFile(outRoot, "ToolComponent.vue")).text();
			const { descriptor, errors } = parse(component);
			const script = descriptor.scriptSetup?.content ?? "";
			const template = descriptor.template?.content ?? "";

			// The compiler accepts the block: `<` was escaped, so nothing closed it early.
			expect(errors).toEqual([]);
			expect(component.match(/<\/script>/g)).toHaveLength(1);
			// The literal round-trips to the exact name, so nothing was mangled or dropped.
			expect(JSON.parse(/const toolName = (.*);/.exec(script)?.[1] ?? "null")).toBe(name);
			// The name is bound, never interpolated: the template's only expression is
			// the binding, and the raw name never reaches the markup.
			expect(template).toContain("{{ toolName }}");
			expect(template).not.toContain(name);
			expect(component).toContain('data-testid="word-count-placeholder"');
			expect(component).toContain('id="word-count-placeholder-title"');
		});
	}
});

describe("scaffoldTool registry freshness", () => {
	test("publishes scaffolded metadata through the generated registry", async () => {
		const outRoot = await createOutRoot();
		await scaffoldInto(outRoot);

		const { registryOutput, result, routesOutput } = await generateRegistryFor(outRoot);

		expect(result).toEqual({ ok: true, definitionCount: 1, slugs: ["word-count"] });
		expect(await Bun.file(registryOutput).text()).toContain('from "../tools/word-count/metadata";');
		expect(await Bun.file(routesOutput).text()).toContain('"word-count"');
		// The lazy loader now points at the file the scaffolder actually wrote, so the
		// per-tool path is reachable rather than only type-correct.
		const registry = await Bun.file(registryOutput).text();
		const specifier = /loadComponent: \(\) => import\("([^"]+)"\)/.exec(registry)?.[1] ?? "";
		expect(specifier).toBe("~/tools/word-count/ToolComponent.vue");
		expect(await Bun.file(toolFile(outRoot, "ToolComponent.vue")).exists()).toBe(true);
		const imported = (await import(pathToFileURL(toolFile(outRoot, "metadata.ts")).href)) as {
			readonly toolMetadata?: unknown;
		};
		expect(validateToolMetadata(imported.toolMetadata).ok).toBe(true);
	});

	test("the --check gate fails once a scaffolded tool drifts from its output", async () => {
		const outRoot = await createOutRoot();
		await scaffoldInto(outRoot);
		await generateRegistryFor(outRoot);
		const metadata = await Bun.file(toolFile(outRoot, "metadata.ts")).text();

		// The generated registry carries slugs and import paths, not names, so a
		// renamed tool is the drift that can actually 404 a route.
		await mkdir(join(outRoot, "app", "tools", "renamed-tool"), { recursive: true });
		for (const fileName of ["metadata.ts", "schema.ts", "logic.ts", "ToolComponent.vue"]) {
			await Bun.write(
				join(outRoot, "app", "tools", "renamed-tool", fileName),
				(await Bun.file(toolFile(outRoot, fileName)).text())
					.replaceAll("word-count", "renamed-tool")
					.replaceAll("WordCount", "RenamedTool")
					.replaceAll("Word count", "Renamed tool"),
			);
		}
		expect(metadata).toContain("word-count");
		const drifted = await checkRegistryFor(outRoot);

		expect(drifted.exitCode).not.toBe(0);
		expect(drifted.output).toContain("registry_generation_failed");
		expect(drifted.output).toContain("stale");
	});

	test("the --check gate passes on drift-free output", async () => {
		const outRoot = await createOutRoot();
		await scaffoldInto(outRoot);
		await generateRegistryFor(outRoot);

		const clean = await checkRegistryFor(outRoot);

		expect(clean.output).toContain("1 tool definitions, 0 errors");
		expect(clean.exitCode).toBe(0);
	});

	test("ci:local runs the freshness gate ahead of the tests", async () => {
		const manifest = JSON.parse(
			await Bun.file(resolve(dirname(fileURLToPath(import.meta.url)), "../../package.json")).text(),
		) as { readonly scripts: Readonly<Record<string, string>> };
		const steps = manifest.scripts["ci:local"]?.split(" && ") ?? [];

		expect(steps.indexOf("bun run generate:registry -- --check")).toBeGreaterThanOrEqual(0);
		expect(steps.indexOf("bun run generate:registry -- --check")).toBeLessThan(
			steps.indexOf("bun run test"),
		);
	});
});

describe("scaffold-tool CLI", () => {
	test("creates five files once and then exits nonzero with existing_tool", async () => {
		const outRoot = await createOutRoot();
		const run = () =>
			Bun.spawn([process.execPath, scriptPath, ...completeArguments, "--out-root", outRoot], {
				cwd: outRoot,
				stdout: "pipe",
				stderr: "pipe",
			});

		const first = run();
		const [firstStdout, firstStderr, firstExit] = await Promise.all([
			new Response(first.stdout).text(),
			new Response(first.stderr).text(),
			first.exited,
		]);

		expect(firstExit).toBe(0);
		expect(`${firstStdout}${firstStderr}`).toContain("5 files");
		expect(await readToolDirectory(outRoot, "word-count")).toEqual([...generatedFileNames]);

		const second = run();
		const [secondStdout, secondStderr, secondExit] = await Promise.all([
			new Response(second.stdout).text(),
			new Response(second.stderr).text(),
			second.exited,
		]);

		expect(secondExit).not.toBe(0);
		expect(`${secondStdout}${secondStderr}`).toContain("existing_tool");
		expect(await readToolDirectory(outRoot, "word-count")).toEqual([...generatedFileNames]);
	});

	test("exits nonzero with a stable parse code for invalid arguments", async () => {
		const child = Bun.spawn([process.execPath, scriptPath, "--slug", "Word_Count"], {
			cwd: tmpdir(),
			stdout: "pipe",
			stderr: "pipe",
		});
		const [stdout, stderr, exitCode] = await Promise.all([
			new Response(child.stdout).text(),
			new Response(child.stderr).text(),
			child.exited,
		]);

		expect(exitCode).not.toBe(0);
		expect(`${stdout}${stderr}`).toContain("invalid_slug");
	});
});
