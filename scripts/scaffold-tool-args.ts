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

type FlagValues = ReadonlyMap<string, string>;

type TextFields = Readonly<{ slug: string; name: string; description: string }>;

const supportedCategories = ["Everyday", "Text", "Developer", "Media"] as const;

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

/** Reads one flag as trimmed text, so every field sees the same empty default. */
function readFlag(values: FlagValues, flag: string): string {
	return values.get(flag)?.trim() ?? "";
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

function readTextFields(values: FlagValues): Result<TextFields> {
	const slug = readFlag(values, "--slug");
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
		return failure("invalid_slug", "Tool slug must be a lowercase kebab-case string");
	}

	const name = readFlag(values, "--name");
	if (!name) {
		return failure("missing_name", "Tool name is required");
	}

	const description = readFlag(values, "--description");
	if (!description) {
		return failure("missing_description", "Tool description is required");
	}

	return { ok: true, value: { slug, name, description } };
}

function readCategory(values: FlagValues): Result<Exclude<ToolCategory, "All">> {
	const category = readFlag(values, "--category");
	if (!supportedCategories.some((candidate) => candidate === category)) {
		return failure(
			"invalid_category",
			`Tool category must be one of ${supportedCategories.join(", ")}`,
		);
	}

	return { ok: true, value: category as Exclude<ToolCategory, "All"> };
}

function readKeywords(values: FlagValues, slug: string): Result<string[]> {
	const keywords = (values.get("--keywords") ?? slug)
		.split(",")
		.map((keyword) => keyword.trim())
		.filter((keyword) => keyword.length > 0);

	if (keywords.length === 0) {
		return failure("invalid_keywords", "Tool keywords must list at least one word");
	}

	return { ok: true, value: keywords };
}

function readOutRoot(values: FlagValues): Result<string> {
	const outRoot = readFlag(values, "--out-root") || ".";
	if (outRoot.split(/[\\/]+/).some((segment) => segment === "..")) {
		return failure("invalid_arguments", "Output root must not contain a parent directory segment");
	}

	return { ok: true, value: outRoot };
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
	const text = readTextFields(values);
	if (!text.ok) {
		return text;
	}

	const category = readCategory(values);
	if (!category.ok) {
		return category;
	}

	const keywords = readKeywords(values, text.value.slug);
	if (!keywords.ok) {
		return keywords;
	}

	const outRoot = readOutRoot(values);
	if (!outRoot.ok) {
		return outRoot;
	}

	return {
		ok: true,
		value: {
			...text.value,
			category: category.value,
			keywords: keywords.value,
			outRoot: outRoot.value,
		},
	};
}
