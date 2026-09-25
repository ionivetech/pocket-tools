import { type ScaffoldArgs } from "./scaffold-tool-args";

const defaultIcon = "sparkles";
const defaultAccent = "blue";
// T1 validates `~/components/<PascalName>.vue` only, so every scaffolded tool
// points at the shared infrastructure placeholder until that contract grows.
export const infrastructureComponentPath = "~/components/ToolPlaceholder.vue";

function pascalCase(slug: string): string {
	return slug
		.split("-")
		.map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
		.join("");
}

function metadataFile(args: ScaffoldArgs): string {
	const keywords = args.keywords.map((keyword) => JSON.stringify(keyword)).join(", ");

	return [
		'import type { ToolMetadata } from "../../types/tool";',
		"",
		"export const toolMetadata: ToolMetadata = {",
		`\tslug: ${JSON.stringify(args.slug)},`,
		`\tname: ${JSON.stringify(args.name)},`,
		`\tdescription: ${JSON.stringify(args.description)},`,
		`\tcategory: ${JSON.stringify(args.category)},`,
		`\ticon: ${JSON.stringify(defaultIcon)},`,
		`\taccent: ${JSON.stringify(defaultAccent)},`,
		`\tkeywords: [${keywords}],`,
		`\tcomponentPath: ${JSON.stringify(infrastructureComponentPath)},`,
		"};",
		"",
	].join("\n");
}

function schemaFile(args: ScaffoldArgs): string {
	const tool = pascalCase(args.slug);

	return [
		'import type { Result } from "../../types/tool";',
		"",
		`export type ${tool}Input = Readonly<{ text: string }>;`,
		"",
		"/**",
		" * Manual parser for this tool's input shape.",
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
	].join("\n");
}

function logicFile(args: ScaffoldArgs): string {
	const tool = pascalCase(args.slug);

	return [
		'import type { Result } from "../../types/tool";',
		`import type { ${tool}Input } from "./schema";`,
		"",
		`export type ${tool}Output = Readonly<{ summary: string }>;`,
		"",
		"/**",
		" * Empty-state contract for this tool.",
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
	].join("\n");
}

function componentFile(args: ScaffoldArgs): string {
	// The name stays out of the template on purpose: it is cosmetic in a stub no
	// route renders, and any interpolation of it is an injection surface.
	return [
		"<template>",
		`\t<section class="pt-empty" data-testid="${args.slug}-placeholder" aria-labelledby="${args.slug}-placeholder-title">`,
		'\t\t<span class="pt-tool-icon pt-tool-icon--blue"><AppIcon name="sparkles" /></span>',
		"\t\t<div>",
		`\t\t\t<h2 id="${args.slug}-placeholder-title">This tool is not available yet.</h2>`,
		"\t\t\t<p>",
		"\t\t\t\tThe working version is still being built. There is nothing to enter or download here",
		"\t\t\t\tyet.",
		"\t\t\t</p>",
		"\t\t</div>",
		"\t</section>",
		"</template>",
		"",
	].join("\n");
}

function logicTestFile(args: ScaffoldArgs): string {
	const tool = pascalCase(args.slug);

	return [
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
	].join("\n");
}

/** Builds the five stub files in write order; every byte here is covered by the T4 test. */
export function buildFiles(args: ScaffoldArgs): Map<string, string> {
	return new Map([
		["metadata.ts", metadataFile(args)],
		["schema.ts", schemaFile(args)],
		["logic.ts", logicFile(args)],
		["ToolComponent.vue", componentFile(args)],
		["logic.test.ts", logicTestFile(args)],
	]);
}
