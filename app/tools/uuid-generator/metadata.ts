import type { ToolMetadata } from "../../types/tool";

export const toolMetadata: ToolMetadata = {
	slug: "uuid-generator",
	name: "UUID/ULID generator",
	description: "Generate UUIDs and ULIDs in bulk, right in your browser.",
	category: "Developer",
	icon: "sparkles",
	accent: "blue",
	keywords: ["uuid", "ulid", "generator", "developer"],
	componentPath: "~/tools/uuid-generator/ToolComponent.vue",
};
