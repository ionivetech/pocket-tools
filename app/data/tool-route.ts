import type { ToolDefinition } from "../types/tool";

type ToolRouteError = Readonly<{
	code: "tool_not_found";
	statusCode: 404;
	message: "Tool not found";
}>;

export type ToolRouteResult =
	| Readonly<{ ok: true; value: ToolDefinition }>
	| Readonly<{ ok: false; error: ToolRouteError }>;

const toolNotFound: ToolRouteResult = Object.freeze({
	ok: false,
	error: Object.freeze({
		code: "tool_not_found",
		statusCode: 404,
		message: "Tool not found",
	}),
});

/**
 * Resolves a tool route without mutating registry definitions.
 *
 * @example
 * ```ts
 * resolveToolRoute("json-formatter", tools);
 * ```
 */
export function resolveToolRoute(
	slug: unknown,
	definitions: readonly ToolDefinition[],
): ToolRouteResult {
	if (typeof slug !== "string") return toolNotFound;

	const normalizedSlug = slug.trim().toLowerCase();
	const value = definitions.find((definition) => definition.slug === normalizedSlug);

	return value ? { ok: true, value } : toolNotFound;
}
