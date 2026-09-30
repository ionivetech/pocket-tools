import type { ToolDefinition } from "../types/tool";
import { toolMetadata as toolMetadata0 } from "../tools/base64-tool/metadata";
import { toolMetadata as toolMetadata1 } from "../tools/case-converter/metadata";
import { toolMetadata as toolMetadata2 } from "../tools/color-picker/metadata";
import { toolMetadata as toolMetadata3 } from "../tools/cron-helper/metadata";
import { toolMetadata as toolMetadata4 } from "../tools/curl-converter/metadata";
import { toolMetadata as toolMetadata5 } from "../tools/diff-checker/metadata";
import { toolMetadata as toolMetadata6 } from "../tools/hash-generator/metadata";
import { toolMetadata as toolMetadata7 } from "../tools/json-formatter/metadata";
import { toolMetadata as toolMetadata8 } from "../tools/jwt-decoder/metadata";
import { toolMetadata as toolMetadata9 } from "../tools/markdown-preview/metadata";
import { toolMetadata as toolMetadata10 } from "../tools/password-generator/metadata";
import { toolMetadata as toolMetadata11 } from "../tools/regex-tester/metadata";
import { toolMetadata as toolMetadata12 } from "../tools/table-to-markdown/metadata";
import { toolMetadata as toolMetadata13 } from "../tools/text-cleaner/metadata";
import { toolMetadata as toolMetadata14 } from "../tools/uuid-generator/metadata";

export const generatedToolDefinitions: ToolDefinition[] = [
	{
		...toolMetadata0,
		loadComponent: () => import("~/tools/base64-tool/ToolComponent.vue"),
	},
	{
		...toolMetadata1,
		loadComponent: () => import("~/tools/case-converter/ToolComponent.vue"),
	},
	{
		...toolMetadata2,
		loadComponent: () => import("~/tools/color-picker/ToolComponent.vue"),
	},
	{
		...toolMetadata3,
		loadComponent: () => import("~/tools/cron-helper/ToolComponent.vue"),
	},
	{
		...toolMetadata4,
		loadComponent: () => import("~/tools/curl-converter/ToolComponent.vue"),
	},
	{
		...toolMetadata5,
		loadComponent: () => import("~/tools/diff-checker/ToolComponent.vue"),
	},
	{
		...toolMetadata6,
		loadComponent: () => import("~/tools/hash-generator/ToolComponent.vue"),
	},
	{
		...toolMetadata7,
		loadComponent: () => import("~/tools/json-formatter/ToolComponent.vue"),
	},
	{
		...toolMetadata8,
		loadComponent: () => import("~/tools/jwt-decoder/ToolComponent.vue"),
	},
	{
		...toolMetadata9,
		loadComponent: () => import("~/tools/markdown-preview/ToolComponent.vue"),
	},
	{
		...toolMetadata10,
		loadComponent: () => import("~/tools/password-generator/ToolComponent.vue"),
	},
	{
		...toolMetadata11,
		loadComponent: () => import("~/tools/regex-tester/ToolComponent.vue"),
	},
	{
		...toolMetadata12,
		loadComponent: () => import("~/tools/table-to-markdown/ToolComponent.vue"),
	},
	{
		...toolMetadata13,
		loadComponent: () => import("~/tools/text-cleaner/ToolComponent.vue"),
	},
	{
		...toolMetadata14,
		loadComponent: () => import("~/tools/uuid-generator/ToolComponent.vue"),
	},
];
