import type { ToolDefinition } from "../types/tool";
import { toolMetadata as toolMetadata0 } from "../tools/color-picker/metadata";
import { toolMetadata as toolMetadata1 } from "../tools/json-formatter/metadata";
import { toolMetadata as toolMetadata2 } from "../tools/password-generator/metadata";
import { toolMetadata as toolMetadata3 } from "../tools/text-cleaner/metadata";

export const generatedToolDefinitions: ToolDefinition[] = [
	{
		...toolMetadata0,
		loadComponent: () => import("~/components/ToolPlaceholder.vue"),
	},
	{
		...toolMetadata1,
		loadComponent: () => import("~/components/ToolPlaceholder.vue"),
	},
	{
		...toolMetadata2,
		loadComponent: () => import("~/components/ToolPlaceholder.vue"),
	},
	{
		...toolMetadata3,
		loadComponent: () => import("~/components/ToolPlaceholder.vue"),
	},
];
