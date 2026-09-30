import type { ToolMetadata } from "../../types/tool";

export const toolMetadata: ToolMetadata = {
	slug: "markdown-preview",
	name: "Markdown preview",
	description: "Write simple markdown and see it rendered.",
	category: "Text",
	icon: "bars",
	accent: "blue",
	keywords: ["markdown", "preview", "text"],
	componentPath: "~/tools/markdown-preview/ToolComponent.vue",
};
