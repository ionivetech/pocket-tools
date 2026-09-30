import type { ToolMetadata } from "../../types/tool";

export const toolMetadata: ToolMetadata = {
	slug: "diff-checker",
	name: "Diff checker",
	description: "Compare two texts line by line.",
	category: "Developer",
	icon: "align-left",
	accent: "blue-muted",
	keywords: ["diff", "compare", "changes"],
	componentPath: "~/tools/diff-checker/ToolComponent.vue",
};
