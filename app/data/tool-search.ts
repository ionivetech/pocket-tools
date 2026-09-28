import type { ToolDefinition } from "../types/tool";

export type ToolSearchOptions = Readonly<{
	query: string;
	category: string;
}>;

/**
 * Filters tools without changing the source collection.
 *
 * @example
 * ```ts
 * filterTools(tools, { query: "json", category: "All" });
 * ```
 */
export function filterTools(
	definitions: readonly ToolDefinition[],
	options: ToolSearchOptions,
): ToolDefinition[] {
	const query = options.query.trim().toLowerCase();

	return definitions.filter((definition) => {
		const matchesCategory = options.category === "All" || definition.category === options.category;
		const matchesQuery =
			query.length === 0 ||
			`${definition.name} ${definition.description} ${definition.category} ${definition.keywords.join(" ")}`
				.toLowerCase()
				.includes(query);

		return matchesCategory && matchesQuery;
	});
}
