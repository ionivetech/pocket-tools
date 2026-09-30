import type { ToolDefinition } from "../types/tool";
import { toolMetadata as toolMetadata0 } from "../tools/base64-tool/metadata";
import { toolMetadata as toolMetadata1 } from "../tools/color-picker/metadata";
import { toolMetadata as toolMetadata2 } from "../tools/cron-helper/metadata";
import { toolMetadata as toolMetadata3 } from "../tools/diff-checker/metadata";
import { toolMetadata as toolMetadata4 } from "../tools/hash-generator/metadata";
import { toolMetadata as toolMetadata5 } from "../tools/json-formatter/metadata";
import { toolMetadata as toolMetadata6 } from "../tools/jwt-decoder/metadata";
import { toolMetadata as toolMetadata7 } from "../tools/password-generator/metadata";
import { toolMetadata as toolMetadata8 } from "../tools/regex-tester/metadata";
import { toolMetadata as toolMetadata9 } from "../tools/text-cleaner/metadata";
import { toolMetadata as toolMetadata10 } from "../tools/uuid-generator/metadata";

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
		loadComponent: () => import("~/tools/cron-helper/ToolComponent.vue"),
	},
	{
		...toolMetadata3,
		loadComponent: () => import("~/tools/diff-checker/ToolComponent.vue"),
	},
	{
		...toolMetadata4,
		loadComponent: () => import("~/tools/hash-generator/ToolComponent.vue"),
	},
	{
		...toolMetadata5,
		loadComponent: () => import("~/tools/json-formatter/ToolComponent.vue"),
	},
	{
		...toolMetadata6,
		loadComponent: () => import("~/tools/jwt-decoder/ToolComponent.vue"),
	},
	{
		...toolMetadata7,
		loadComponent: () => import("~/components/ToolPlaceholder.vue"),
	},
	{
		...toolMetadata8,
		loadComponent: () => import("~/tools/regex-tester/ToolComponent.vue"),
	},
	{
		...toolMetadata9,
		loadComponent: () => import("~/tools/text-cleaner/ToolComponent.vue"),
	},
	{
		...toolMetadata10,
		loadComponent: () => import("~/tools/uuid-generator/ToolComponent.vue"),
	},
];
