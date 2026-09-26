import type { ToolMetadata } from "../../types/tool";

export const toolMetadata: ToolMetadata = {
	slug: "color-picker",
	name: "Color picker",
	description: "Find a useful color and copy its values quickly.",
	category: "Media",
	icon: "palette",
	accent: "blue-soft",
	keywords: ["color", "hex", "rgb", "media"],
	componentPath: "~/components/ToolPlaceholder.vue",
};
