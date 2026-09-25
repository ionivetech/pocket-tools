import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
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

const temporaryDirectories: string[] = [];

const scriptPath = resolve(
	dirname(fileURLToPath(import.meta.url)),
	"../../scripts/scaffold-tool.ts",
);

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
				componentPath: "~/components/ToolPlaceholder.vue",
			},
		});
		expect(validation.ok && validation.value.componentPath).toBe(
			"~/components/ToolPlaceholder.vue",
		);
	});

	test("keeps the T1 component-path contract and explains the placeholder choice", async () => {
		const outRoot = await createOutRoot();
		const result = await scaffoldTool(await parsedScaffoldArgs(outRoot));

		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}

		expect(
			validateToolMetadata({
				slug: "word-count",
				name: "Word count",
				description: "Count words and characters in your text.",
				category: "Text",
				icon: "sparkles",
				accent: "blue",
				keywords: ["words"],
				componentPath: "~/components/tools/word-count/ToolComponent.vue",
			}).error.code,
		).toBe("invalid_tool_component_path");
		expect(result.value.notes.join(" ")).toContain("ToolPlaceholder.vue");
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
