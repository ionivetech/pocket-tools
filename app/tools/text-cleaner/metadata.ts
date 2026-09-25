import type { ToolMetadata } from "../../types/tool";

export const toolMetadata: ToolMetadata = {
	slug: "text-cleaner",
	name: "Text cleaner",
	description: "Clean up spacing and count what matters.",
	category: "Text",
	icon: "align-left",
	accent: "blue-muted",
	keywords: ["text", "clean", "count", "whitespace"],
	componentPath: "~/components/ToolPlaceholder.vue",
};
