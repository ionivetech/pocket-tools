import type { ToolMetadata } from "../../types/tool";

export const toolMetadata: ToolMetadata = {
	slug: "image-resizer",
	name: "Image resizer",
	description: "Change image size and format.",
	category: "Media",
	icon: "star-fill",
	accent: "blue-soft",
	keywords: ["image", "resize", "convert"],
	componentPath: "~/tools/image-resizer/ToolComponent.vue",
};
