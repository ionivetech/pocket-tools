import { mkdir, stat, writeFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { type Result } from "../app/types/tool";
import { parseScaffoldArgs, type ScaffoldArgs, type ScaffoldErrorCode } from "./scaffold-tool-args";
import { buildFiles, toolComponentPath } from "./scaffold-tool-files";

export { parseScaffoldArgs };
export type { ScaffoldArgs, ScaffoldErrorCode };

export type ScaffoldResult = Readonly<{
	slug: string;
	directory: string;
	files: readonly string[];
	componentPath: string;
	notes: readonly string[];
}>;

export type ScaffoldEnvironment = Readonly<{ cwd: string }>;

function failure<T>(code: ScaffoldErrorCode, message: string): Result<T> {
	return { ok: false, error: { code, message } };
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function isExisting(error: unknown): boolean {
	return (error as { readonly code?: string } | null)?.code === "EEXIST";
}

/** Resolves the tool folder and refuses any path that escapes the output root. */
function resolveToolDirectory(
	args: ScaffoldArgs,
	environment: ScaffoldEnvironment,
): Result<string> {
	const toolsRoot = resolve(environment.cwd, args.outRoot, "app", "tools");
	const directory = join(toolsRoot, args.slug);
	const pathFromRoot = relative(toolsRoot, directory);

	// Slug and outRoot are already strict, so this only guards the write boundary.
	if (pathFromRoot.startsWith(`..${sep}`) || isAbsolute(pathFromRoot)) {
		return failure("invalid_arguments", "Tool directory must stay inside the output root");
	}

	return { ok: true, value: directory };
}

/** A successful stat is the only proof the folder exists; any other error
 * (ENOENT, ENOTDIR, EACCES) must fall through to mkdir for the real reason. */
async function directoryExists(directory: string): Promise<boolean> {
	return stat(directory).then(
		() => true,
		() => false,
	);
}

async function writeStubFiles(
	directory: string,
	args: ScaffoldArgs,
): Promise<Result<ScaffoldResult>> {
	const files = buildFiles(args);
	for (const [fileName, content] of files) {
		await writeFile(join(directory, fileName), content, { flag: "wx" });
	}

	const componentPath = toolComponentPath(args.slug);

	return {
		ok: true,
		value: {
			slug: args.slug,
			directory,
			files: [...files.keys()],
			componentPath,
			notes: [
				`componentPath is ${componentPath}: the tool renders its own ToolComponent.vue, which stays a placeholder until the real logic replaces it.`,
			],
		},
	};
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
	const target = resolveToolDirectory(args, environment);
	if (!target.ok) {
		return target;
	}
	const directory = target.value;

	if (await directoryExists(directory)) {
		return failure("existing_tool", `Tool already exists at ${directory}`);
	}

	try {
		await mkdir(directory, { recursive: true });
		return await writeStubFiles(directory, args);
	} catch (error) {
		return isExisting(error)
			? failure("existing_tool", `Tool already exists at ${directory}`)
			: failure("write_failed", `Could not scaffold ${args.slug}: ${errorMessage(error)}`);
	}
}

function reportError(error: { readonly code: string; readonly message: string }): void {
	console.log(`0 files, 1 error: ${error.code} - ${error.message}`);
	process.exitCode = 1;
}

async function runCli() {
	const argv = process.argv.slice(2).filter((argument) => argument !== "--");
	const parsed = parseScaffoldArgs(argv);

	if (!parsed.ok) {
		reportError(parsed.error);
		return;
	}

	const result = await scaffoldTool(parsed.value);
	if (!result.ok) {
		reportError(result.error);
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
