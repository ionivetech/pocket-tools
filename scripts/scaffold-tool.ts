import { mkdir, stat, writeFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { type Result, type ToolCategory } from "../app/types/tool";

export type ScaffoldErrorCode =
	| "invalid_arguments"
	| "invalid_slug"
	| "invalid_category"
	| "invalid_keywords"
	| "missing_name"
	| "missing_description"
	| "existing_tool"
	| "write_failed";

export type ScaffoldArgs = Readonly<{
	slug: string;
	name: string;
	description: string;
	category: Exclude<ToolCategory, "All">;
	keywords: readonly string[];
	outRoot: string;
}>;

export type ScaffoldResult = Readonly<{
	slug: string;
	directory: string;
	files: readonly string[];
	componentPath: string;
	notes: readonly string[];
}>;

export type ScaffoldEnvironment = Readonly<{ cwd: string }>;

const supportedCategories = ["Everyday", "Text", "Developer", "Media"] as const;
const defaultIcon = "sparkles";
const defaultAccent = "blue";
// T1 validates `~/components/<PascalName>.vue` only, so every scaffolded tool
// points at the shared infrastructure placeholder until that contract grows.
const infrastructureComponentPath = "~/components/ToolPlaceholder.vue";
const allowedFlags = new Set([
	"--slug",
	"--name",
	"--description",
	"--category",
	"--keywords",
	"--out-root",
]);

function failure<T>(code: ScaffoldErrorCode, message: string): Result<T> {
	return { ok: false, error: { code, message } };
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function isExisting(error: unknown): boolean {
	return (error as { readonly code?: string } | null)?.code === "EEXIST";
}

function pascalCase(slug: string): string {
	return slug
		.split("-")
		.map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
		.join("");
}

function readFlags(argv: readonly string[]): Result<Map<string, string>> {
	const flags = new Map<string, string>();

	for (let index = 0; index < argv.length; index += 2) {
		const key = argv[index];
		const value = argv[index + 1];
		if (key === undefined || value === undefined || !allowedFlags.has(key) || flags.has(key)) {
			return failure(
				"invalid_arguments",
				`Expected --flag value pairs from --slug, --name, --description, --category, --keywords, and --out-root, but received ${key ?? "(nothing)"}`,
			);
		}
		flags.set(key, value);
	}

	return { ok: true, value: flags };
}

/**
 * Parses scaffolder CLI arguments without touching the filesystem.
 *
 * @example
 * ```ts
 * parseScaffoldArgs(["--slug", "word-count", "--name", "Word count", "--description", "Count words locally.", "--category", "Text", "--keywords", "words,count"]);
 * // { ok: true, value: { slug: "word-count", keywords: ["words", "count"], outRoot: ".", ... } }
 * ```
 */
export function parseScaffoldArgs(argv: readonly string[]): Result<ScaffoldArgs> {
	const flags = readFlags(argv);
	if (!flags.ok) {
		return flags;
	}
	const values = flags.value;

	const slug = values.get("--slug")?.trim() ?? "";
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
		return failure("invalid_slug", "Tool slug must be a lowercase kebab-case string");
	}

	const name = values.get("--name")?.trim() ?? "";
	if (!name) {
		return failure("missing_name", "Tool name is required");
	}

	const description = values.get("--description")?.trim() ?? "";
	if (!description) {
		return failure("missing_description", "Tool description is required");
	}

	const category = values.get("--category")?.trim() ?? "";
	if (!supportedCategories.some((candidate) => candidate === category)) {
		return failure(
			"invalid_category",
			`Tool category must be one of ${supportedCategories.join(", ")}`,
		);
	}

	const rawKeywords = values.get("--keywords");
	const keywords = (rawKeywords ?? slug)
		.split(",")
		.map((keyword) => keyword.trim())
		.filter((keyword) => keyword.length > 0);
	if (keywords.length === 0) {
		return failure("invalid_keywords", "Tool keywords must list at least one word");
	}

	const outRoot = values.get("--out-root")?.trim() || ".";
	if (outRoot.split(/[\\/]+/).some((segment) => segment === "..")) {
		return failure("invalid_arguments", "Output root must not contain a parent directory segment");
	}

	return {
		ok: true,
		value: {
			slug,
			name,
			description,
			category: category as Exclude<ToolCategory, "All">,
			keywords,
			outRoot,
		},
	};
}

function buildFiles(args: ScaffoldArgs): Map<string, string> {
	const tool = pascalCase(args.slug);
	const name = JSON.stringify(args.name);
	const keywords = args.keywords.map((keyword) => JSON.stringify(keyword)).join(", ");

	return new Map([
		[
			"metadata.ts",
			[
				'import type { ToolMetadata } from "../../types/tool";',
				"",
				"export const toolMetadata: ToolMetadata = {",
				`\tslug: ${JSON.stringify(args.slug)},`,
				`\tname: ${name},`,
				`\tdescription: ${JSON.stringify(args.description)},`,
				`\tcategory: ${JSON.stringify(args.category)},`,
				`\ticon: ${JSON.stringify(defaultIcon)},`,
				`\taccent: ${JSON.stringify(defaultAccent)},`,
				`\tkeywords: [${keywords}],`,
				`\tcomponentPath: ${JSON.stringify(infrastructureComponentPath)},`,
				"};",
				"",
			].join("\n"),
		],
		[
			"schema.ts",
			[
				'import type { Result } from "../../types/tool";',
				"",
				`export type ${tool}Input = Readonly<{ text: string }>;`,
				"",
				"/**",
				` * Manual parser for the ${args.name} input shape.`,
				" *",
				" * @example",
				" * ```ts",
				` * parse${tool}Input({ text: "hello" }).ok; // true`,
				` * parse${tool}Input({ text: 1 }).error.code; // "invalid_input"`,
				" * ```",
				" */",
				`export function parse${tool}Input(value: unknown): Result<${tool}Input> {`,
				'\tif (typeof value !== "object" || value === null || Array.isArray(value)) {',
				"\t\treturn {",
				"\t\t\tok: false,",
				'\t\t\terror: { code: "invalid_input", message: "Input must be an object." },',
				"\t\t};",
				"\t}",
				"",
				"\tconst text = (value as { readonly text?: unknown }).text;",
				'\tif (typeof text !== "string") {',
				"\t\treturn {",
				"\t\t\tok: false,",
				'\t\t\terror: { code: "invalid_input", message: "Text must be a string." },',
				"\t\t};",
				"\t}",
				"",
				"\treturn { ok: true, value: { text } };",
				"}",
				"",
			].join("\n"),
		],
		[
			"logic.ts",
			[
				'import type { Result } from "../../types/tool";',
				`import type { ${tool}Input } from "./schema";`,
				"",
				`export type ${tool}Output = Readonly<{ summary: string }>;`,
				"",
				"/**",
				` * Empty-state contract for ${args.name}.`,
				" *",
				" * The scaffold ships no tool algorithm on purpose. Implement the real",
				" * behaviour here and return a genuine `Result` instead of a fake success.",
				" *",
				" * @example",
				" * ```ts",
				` * run${tool}({ text: "" }).error.code; // "not_implemented"`,
				" * ```",
				" */",
				`export function run${tool}(input: ${tool}Input): Result<${tool}Output> {`,
				"\tvoid input;",
				"\treturn {",
				"\t\tok: false,",
				"\t\terror: {",
				'\t\t\tcode: "not_implemented",',
				`\t\t\tmessage: ${JSON.stringify(`${args.name} has no working logic yet.`)},`,
				"\t\t},",
				"\t};",
				"}",
				"",
			].join("\n"),
		],
		[
			"ToolComponent.vue",
			[
				"<template>",
				`\t<section class="pt-empty" data-testid="${args.slug}-placeholder" aria-labelledby="${args.slug}-placeholder-title">`,
				'\t\t<span class="pt-tool-icon pt-tool-icon--blue"><AppIcon name="sparkles" /></span>',
				"\t\t<div>",
				`\t\t\t<h2 id="${args.slug}-placeholder-title">${args.name} is not available yet.</h2>`,
				"\t\t\t<p>",
				"\t\t\t\tThe working version is still being built. There is nothing to enter or download here",
				"\t\t\t\tyet.",
				"\t\t\t</p>",
				"\t\t</div>",
				"\t</section>",
				"</template>",
				"",
			].join("\n"),
		],
		[
			"logic.test.ts",
			[
				'import { describe, expect, test } from "bun:test";',
				`import { run${tool} } from "./logic";`,
				`import { parse${tool}Input } from "./schema";`,
				"",
				`describe("${args.slug} scaffold", () => {`,
				'\ttest("rejects a non-string text value", () => {',
				`\t\texpect(parse${tool}Input({ text: 1 })).toMatchObject({`,
				"\t\t\tok: false,",
				'\t\t\terror: { code: "invalid_input" },',
				"\t\t});",
				"\t});",
				"",
				'\ttest("keeps the empty-state contract until the tool is implemented", () => {',
				`\t\texpect(run${tool}({ text: "" })).toMatchObject({`,
				"\t\t\tok: false,",
				'\t\t\terror: { code: "not_implemented" },',
				"\t\t});",
				"\t});",
				"});",
				"",
			].join("\n"),
		],
	]);
}

/**
 * Creates the tool folder and its five stub files under `<outRoot>/app/tools/<slug>`.
 *
 * @example
 * ```ts
 * const parsed = parseScaffoldArgs(["--slug", "word-count", "--name", "Word count", "--description", "Count words locally.", "--category", "Text"]);
 * if (parsed.ok) {
 * 	const result = await scaffoldTool(parsed.value, { cwd: "/tmp/isolated" });
 * }
 * ```
 */
export async function scaffoldTool(
	args: ScaffoldArgs,
	environment: ScaffoldEnvironment = { cwd: process.cwd() },
): Promise<Result<ScaffoldResult>> {
	const toolsRoot = resolve(environment.cwd, args.outRoot, "app", "tools");
	const directory = join(toolsRoot, args.slug);

	// Slug and outRoot are already strict, so this only guards the write boundary.
	if (
		relative(toolsRoot, directory).startsWith(`..${sep}`) ||
		isAbsolute(relative(toolsRoot, directory))
	) {
		return failure("invalid_arguments", "Tool directory must stay inside the output root");
	}

	// A successful stat is the only proof the folder exists; any other error
	// (ENOENT, ENOTDIR, EACCES) must fall through to mkdir for the real reason.
	const alreadyExists = await stat(directory).then(
		() => true,
		() => false,
	);
	if (alreadyExists) {
		return failure("existing_tool", `Tool already exists at ${directory}`);
	}

	try {
		await mkdir(directory, { recursive: true });
		const files = buildFiles(args);
		for (const [fileName, content] of files) {
			await writeFile(join(directory, fileName), content, { flag: "wx" });
		}

		return {
			ok: true,
			value: {
				slug: args.slug,
				directory,
				files: [...files.keys()],
				componentPath: infrastructureComponentPath,
				notes: [
					`componentPath stays ${infrastructureComponentPath}: the T1 contract only accepts ~/components/<PascalName>.vue, so the per-tool ToolComponent.vue is not wired until that contract changes.`,
				],
			},
		};
	} catch (error) {
		return isExisting(error)
			? failure("existing_tool", `Tool already exists at ${directory}`)
			: failure("write_failed", `Could not scaffold ${args.slug}: ${errorMessage(error)}`);
	}
}

async function runCli() {
	const argv = process.argv.slice(2).filter((argument) => argument !== "--");
	const parsed = parseScaffoldArgs(argv);

	if (!parsed.ok) {
		console.log(`0 files, 1 error: ${parsed.error.code} - ${parsed.error.message}`);
		process.exitCode = 1;
		return;
	}

	const result = await scaffoldTool(parsed.value);
	if (!result.ok) {
		console.log(`0 files, 1 error: ${result.error.code} - ${result.error.message}`);
		process.exitCode = 1;
		return;
	}

	console.log(
		`${result.value.files.length} files, 0 errors: created ${result.value.slug} in ${result.value.directory}`,
	);
	for (const note of result.value.notes) {
		console.log(`note: ${note}`);
	}
}

if (import.meta.main) {
	await runCli();
}
