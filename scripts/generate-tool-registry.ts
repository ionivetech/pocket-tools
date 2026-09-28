import { dirname, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { type ToolMetadata, validateToolMetadata } from "../app/types/tool";

export type GenerationErrorCode =
	| "no_tool_sources"
	| "duplicate_tool_slug"
	| "invalid_tool_metadata"
	| "registry_generation_failed";

export type GenerationOptions = Readonly<{
	toolsRoot: string;
	registryOutput: string;
	routesOutput: string;
}>;

export type GenerationResult =
	| { ok: true; definitionCount: number; slugs: string[] }
	| {
			ok: false;
			definitionCount: number;
			slugs: string[];
			error: { code: GenerationErrorCode; message: string };
	  };

type MetadataSource = Readonly<{
	metadata: ToolMetadata;
	sourcePath: string;
}>;

type BuiltRegistry = Readonly<{
	definitionCount: number;
	registryContent: string;
	routesContent: string;
	slugs: string[];
}>;

type GeneratorResult<T> =
	| { ok: true; value: T }
	| { ok: false; error: { code: GenerationErrorCode; message: string } };

const defaultOptions: GenerationOptions = {
	toolsRoot: "app/tools",
	registryOutput: "app/data/tool-registry.generated.ts",
	routesOutput: "app/data/tool-routes.generated.ts",
};

function failure<T>(code: GenerationErrorCode, message: string): GeneratorResult<T> {
	return { ok: false, error: { code, message } };
}

function compareText(left: string, right: string): number {
	return left < right ? -1 : left > right ? 1 : 0;
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function modulePath(fromFile: string, toFile: string): string {
	const withoutTypeScriptExtension = toFile.endsWith(".ts") ? toFile.slice(0, -3) : toFile;
	const path = relative(dirname(fromFile), withoutTypeScriptExtension).split(sep).join("/");
	return path.startsWith(".") ? path : `./${path}`;
}

async function discoverMetadata(options: GenerationOptions): Promise<GeneratorResult<string[]>> {
	try {
		const paths: string[] = [];
		const glob = new Bun.Glob("*/metadata.ts");
		for await (const path of glob.scan({
			absolute: true,
			cwd: options.toolsRoot,
			onlyFiles: true,
		})) {
			paths.push(path);
		}
		paths.sort(compareText);

		if (paths.length === 0) {
			return failure("no_tool_sources", `No tool metadata found under ${options.toolsRoot}`);
		}

		return { ok: true, value: paths };
	} catch (error) {
		return failure("registry_generation_failed", `Tool discovery failed: ${errorMessage(error)}`);
	}
}

async function loadMetadataSources(
	options: GenerationOptions,
): Promise<GeneratorResult<MetadataSource[]>> {
	const discovered = await discoverMetadata(options);
	if (!discovered.ok) {
		return discovered;
	}

	const sources: MetadataSource[] = [];
	const seenSlugs = new Set<string>();

	for (const sourcePath of discovered.value) {
		let imported: unknown;
		try {
			imported = await import(pathToFileURL(sourcePath).href);
		} catch (error) {
			return failure(
				"registry_generation_failed",
				`Could not import ${sourcePath}: ${errorMessage(error)}`,
			);
		}

		if (typeof imported !== "object" || imported === null || !("toolMetadata" in imported)) {
			return failure("invalid_tool_metadata", `${sourcePath} does not export toolMetadata`);
		}

		const value = (imported as { readonly toolMetadata?: unknown }).toolMetadata;
		const validation = validateToolMetadata(value);
		if (!validation.ok) {
			return failure("invalid_tool_metadata", `${sourcePath}: ${validation.error.message}`);
		}

		if (seenSlugs.has(validation.value.slug)) {
			return failure("duplicate_tool_slug", `Duplicate tool slug: ${validation.value.slug}`);
		}
		seenSlugs.add(validation.value.slug);
		sources.push({ metadata: validation.value, sourcePath });
	}

	return { ok: true, value: sources };
}

async function buildRegistry(options: GenerationOptions): Promise<GeneratorResult<BuiltRegistry>> {
	const loaded = await loadMetadataSources(options);
	if (!loaded.ok) {
		return loaded;
	}

	const sources = [...loaded.value].sort((left, right) =>
		compareText(left.metadata.slug, right.metadata.slug),
	);
	const slugs = sources.map(({ metadata }) => metadata.slug);
	const typeImport = modulePath(
		options.registryOutput,
		resolve(options.toolsRoot, "..", "types", "tool.ts"),
	);
	const sourceImports = sources.map(
		({ sourcePath }, index) =>
			`import { toolMetadata as toolMetadata${index} } from "${modulePath(options.registryOutput, sourcePath)}";`,
	);
	const definitions = sources.flatMap(({ metadata }, index) => [
		"\t{",
		`\t\t...toolMetadata${index},`,
		`\t\tloadComponent: () => import(${JSON.stringify(metadata.componentPath)}),`,
		"\t},",
	]);
	const registryContent = [
		`import type { ToolDefinition } from "${typeImport}";`,
		...sourceImports,
		"",
		"export const generatedToolDefinitions: ToolDefinition[] = [",
		...definitions,
		"];",
		"",
	].join("\n");
	const routesContent = [
		"export const generatedToolSlugs = [",
		...slugs.map((slug) => `\t${JSON.stringify(slug)},`),
		"] as const;",
		"",
	].join("\n");

	return {
		ok: true,
		value: { definitionCount: sources.length, registryContent, routesContent, slugs },
	};
}

function failedGenerationResult(error: {
	code: GenerationErrorCode;
	message: string;
}): GenerationResult {
	return { ok: false, definitionCount: 0, slugs: [], error };
}

/**
 * Generates deterministic registry and route TypeScript files from tool metadata.
 *
 * @example
 * ```ts
 * const result = await generateToolRegistry({
 * 	toolsRoot: "app/tools",
 * 	registryOutput: "app/data/tool-registry.generated.ts",
 * 	routesOutput: "app/data/tool-routes.generated.ts",
 * });
 * ```
 */
export async function generateToolRegistry(options: GenerationOptions): Promise<GenerationResult> {
	const built = await buildRegistry(options);
	if (!built.ok) {
		return failedGenerationResult(built.error);
	}

	try {
		await Bun.write(options.registryOutput, built.value.registryContent);
		await Bun.write(options.routesOutput, built.value.routesContent);
	} catch (error) {
		return failedGenerationResult({
			code: "registry_generation_failed",
			message: `Could not write generated registry files: ${errorMessage(error)}`,
		});
	}

	return {
		ok: true,
		definitionCount: built.value.definitionCount,
		slugs: built.value.slugs,
	};
}

/**
 * Checks that the default generated files exactly match the tool metadata.
 *
 * @example
 * ```ts
 * const result = await checkGeneratedRegistry();
 * if (!result.ok) throw new Error(result.error.message);
 * ```
 */
export async function checkGeneratedRegistry(): Promise<GenerationResult> {
	const built = await buildRegistry(defaultOptions);
	if (!built.ok) {
		return failedGenerationResult(built.error);
	}

	try {
		const [registryFile, routesFile] = [
			Bun.file(defaultOptions.registryOutput),
			Bun.file(defaultOptions.routesOutput),
		];
		const [registryExists, routesExist, registryContent, routesContent] = await Promise.all([
			registryFile.exists(),
			routesFile.exists(),
			registryFile.text(),
			routesFile.text(),
		]);

		if (
			!registryExists ||
			!routesExist ||
			registryContent !== built.value.registryContent ||
			routesContent !== built.value.routesContent
		) {
			return failedGenerationResult({
				code: "registry_generation_failed",
				message: "Generated registry output is stale",
			});
		}
	} catch (error) {
		return failedGenerationResult({
			code: "registry_generation_failed",
			message: `Generated registry output is stale or unreadable: ${errorMessage(error)}`,
		});
	}

	return {
		ok: true,
		definitionCount: built.value.definitionCount,
		slugs: built.value.slugs,
	};
}

async function runCli() {
	const args = process.argv.slice(2).filter((argument) => argument !== "--");
	const invalidArguments = args.filter((argument) => argument !== "--check");
	const result = invalidArguments.length
		? failedGenerationResult({
				code: "registry_generation_failed",
				message: `Unknown argument: ${invalidArguments[0] ?? ""}`,
			})
		: args.includes("--check")
			? await checkGeneratedRegistry()
			: await generateToolRegistry(defaultOptions);
	const errorCount = result.ok ? 0 : 1;
	const errorContext = result.ok ? "" : `: ${result.error.code} - ${result.error.message}`;
	const errorLabel = errorCount === 1 ? "error" : "errors";

	console.log(
		`${result.definitionCount} tool definitions, ${errorCount} ${errorLabel}${errorContext}`,
	);
	if (!result.ok) {
		process.exitCode = 1;
	}
}

if (import.meta.main) {
	await runCli();
}
