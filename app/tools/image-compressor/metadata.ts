import type { ToolMetadata } from "../../types/tool";

export const toolMetadata: ToolMetadata = {
	slug: "image-compressor",
	name: "Image compressor",
	description: "Shrink a photo so it is easier to share.",
	category: "Media",
	icon: "star",
	accent: "blue",
	keywords: ["image", "compress", "photo"],
	componentPath: "~/tools/image-compressor/ToolComponent.vue",
};
