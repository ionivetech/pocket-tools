import type { ToolMetadata } from "../../types/tool";

export const toolMetadata: ToolMetadata = {
	slug: "case-converter",
	name: "Case converter",
	description: "Switch text between UPPER, lower, Title and code cases.",
	category: "Text",
	icon: "arrow-up",
	accent: "blue-muted",
	keywords: ["case", "upper", "lower"],
	componentPath: "~/tools/case-converter/ToolComponent.vue",
};
