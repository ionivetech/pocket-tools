import type { ToolDefinition } from "../types/tool";
import { toolMetadata as toolMetadata0 } from "../tools/base64-tool/metadata";
import { toolMetadata as toolMetadata1 } from "../tools/color-picker/metadata";
import { toolMetadata as toolMetadata2 } from "../tools/json-formatter/metadata";
import { toolMetadata as toolMetadata3 } from "../tools/password-generator/metadata";
import { toolMetadata as toolMetadata4 } from "../tools/text-cleaner/metadata";
import { toolMetadata as toolMetadata5 } from "../tools/uuid-generator/metadata";

export const generatedToolDefinitions: ToolDefinition[] = [
	{
		...toolMetadata0,
		loadComponent: () => import("~/tools/base64-tool/ToolComponent.vue"),
	},
	{
		...toolMetadata1,
		loadComponent: () => import("~/components/ToolPlaceholder.vue"),
	},
	{
		...toolMetadata2,
		loadComponent: () => import("~/tools/json-formatter/ToolComponent.vue"),
	},
	{
		...toolMetadata3,
		loadComponent: () => import("~/components/ToolPlaceholder.vue"),
	},
	{
		...toolMetadata4,
		loadComponent: () => import("~/tools/text-cleaner/ToolComponent.vue"),
	},
	{
		...toolMetadata5,
		loadComponent: () => import("~/tools/uuid-generator/ToolComponent.vue"),
	},
];
