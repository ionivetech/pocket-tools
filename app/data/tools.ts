import { createToolRegistry } from "./tool-registry";
import { generatedToolDefinitions } from "./tool-registry.generated";
import type { AppIconName, ToolAccent, ToolCategory, ToolDefinition } from "../types/tool";

export type { AppIconName, ToolAccent, ToolCategory };

export const toolCategories = [
	"All",
	"Everyday",
	"Text",
	"Developer",
	"Media",
] as const satisfies readonly ToolCategory[];

export type Tool = ToolDefinition;

const registry = createToolRegistry(generatedToolDefinitions);

export const tools: readonly Tool[] = registry.list();

/**
 * Finds a tool by its stable slug.
 *
 * @example
 * ```ts
 * findTool("json-formatter");
 * ```
 */
export function findTool(slug: string): Tool | undefined {
	return registry.get(slug);
}
