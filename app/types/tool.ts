import type { Component } from "vue";

const appIconNames = [
	"align-left",
	"arrow-left",
	"arrow-right",
	"arrow-up",
	"arrow-up-right",
	"bars",
	"check-circle",
	"circle-fill",
	"code",
	"exclamation-circle",
	"lock",
	"moon",
	"palette",
	"refresh",
	"search",
	"shield",
	"sparkles",
	"star",
	"star-fill",
	"sun",
	"times",
	"wifi",
] as const;

const metadataCategories = ["Everyday", "Text", "Developer", "Media"] as const;
const metadataAccents = ["blue", "blue-strong", "blue-soft", "blue-muted"] as const;

/**
 * The one canonical list of tool categories. `ToolCategory` is derived from it,
 * and the UI filter list and the scaffolder both read it, so adding a category
 * is a single edit. `"All"` is deliberately absent: it filters, it never labels a tool.
 *
 * @example
 * ```ts
 * toolCategoryValues.includes("Developer"); // true
 * ```
 */
export const toolCategoryValues = metadataCategories;

export type ToolCategory = "All" | (typeof toolCategoryValues)[number];
export type AppIconName = (typeof appIconNames)[number];
export type ToolAccent = (typeof metadataAccents)[number];
/**
 * The two shapes `isToolComponentPath` allows: a shared component under `app/components/`
 * or a tool's own `app/tools/<slug>/ToolComponent.vue`. A closed allowlist, so no remote or
 * `data:` module specifier is representable.
 */
export type ToolComponentPath =
	| `~/components/${string}.vue`
	| `~/tools/${string}/ToolComponent.vue`;

export type ToolMetadata = {
	slug: string;
	name: string;
	description: string;
	category: Exclude<ToolCategory, "All">;
	icon: AppIconName;
	accent: ToolAccent;
	keywords: string[];
	componentPath: ToolComponentPath;
};

export type ToolComponentLoader = () => Promise<Component>;

export type ToolDefinition = ToolMetadata & {
	loadComponent: ToolComponentLoader;
};

export type Result<T> =
	| { ok: true; value: T }
	| { ok: false; error: { code: string; message: string } };

function isMetadataRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOneOf<const T extends string>(value: unknown, values: readonly T[]): value is T {
	return typeof value === "string" && values.some((candidate) => candidate === value);
}

/**
 * The one canonical slug rule: lowercase kebab-case, so a slug is safe as a
 * route segment and a directory name. `validateToolMetadata` and the tool
 * scaffolder both read this, so a slug the scaffolder accepts is one the app
 * can resolve.
 *
 * @example
 * ```ts
 * isToolSlug("word-count"); // true
 * isToolSlug("word--count"); // false
 * ```
 */
export function isToolSlug(value: unknown): value is string {
	return typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function isNonEmptyString(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

function isKeywords(value: unknown): value is string[] {
	return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

/** The per-tool stem obeys the same kebab rule as `isToolSlug`, so no dot, case, or `..`. */
const toolComponentPathPattern =
	/^(?:~\/components\/[A-Z][A-Za-z0-9]*\.vue|~\/tools\/[a-z0-9]+(?:-[a-z0-9]+)*\/ToolComponent\.vue)$/;

function isToolComponentPath(value: unknown): value is ToolComponentPath {
	return typeof value === "string" && toolComponentPathPattern.test(value);
}

function invalidMetadata(code: string, message: string): Result<ToolMetadata> {
	return { ok: false, error: { code, message } };
}

/**
 * Validates untrusted tool metadata without throwing.
 *
 * @example
 * ```ts
 * const result = validateToolMetadata({
 * 	slug: "json-formatter",
 * 	name: "JSON formatter",
 * 	description: "Tidy messy JSON and spot errors at a glance.",
 * 	category: "Developer",
 * 	icon: "code",
 * 	accent: "blue",
 * 	keywords: ["json", "format"],
 * 	componentPath: "~/components/ToolPlaceholder.vue",
 * });
 * ```
 */
export function validateToolMetadata(value: unknown): Result<ToolMetadata> {
	if (!isMetadataRecord(value)) {
		return invalidMetadata("invalid_tool_metadata", "Tool metadata must be an object");
	}

	const metadata = value;

	if (!isToolSlug(metadata.slug)) {
		return invalidMetadata("invalid_tool_slug", "Tool slug must be a lowercase kebab-case string");
	}

	if (!isNonEmptyString(metadata.name)) {
		return invalidMetadata("invalid_tool_name", "Tool name must be a non-empty string");
	}

	if (!isNonEmptyString(metadata.description)) {
		return invalidMetadata(
			"invalid_tool_description",
			"Tool description must be a non-empty string",
		);
	}

	if (!isOneOf(metadata.category, metadataCategories)) {
		return invalidMetadata("invalid_tool_category", "Tool category is not supported");
	}

	if (!isOneOf(metadata.icon, appIconNames)) {
		return invalidMetadata("invalid_tool_icon", "Tool icon is not supported");
	}

	if (!isOneOf(metadata.accent, metadataAccents)) {
		return invalidMetadata("invalid_tool_accent", "Tool accent is not supported");
	}

	if (!isKeywords(metadata.keywords)) {
		return invalidMetadata(
			"invalid_tool_keywords",
			"Tool keywords must be a non-empty string array",
		);
	}

	if (!isToolComponentPath(metadata.componentPath)) {
		return invalidMetadata("invalid_tool_component_path", "Tool component path is invalid");
	}

	return {
		ok: true,
		value: {
			slug: metadata.slug,
			name: metadata.name,
			description: metadata.description,
			category: metadata.category,
			icon: metadata.icon,
			accent: metadata.accent,
			keywords: metadata.keywords,
			componentPath: metadata.componentPath,
		},
	};
}
