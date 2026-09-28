import type { ToolMetadata } from "../../types/tool";

export const toolMetadata: ToolMetadata = {
	slug: "base64-tool",
	name: "Base64 encoder/decoder",
	description: "Encode or decode Base64 text and files, right in your browser.",
	category: "Developer",
	icon: "shield",
	accent: "blue",
	keywords: ["base64", "encode", "decode", "developer"],
	componentPath: "~/tools/base64-tool/ToolComponent.vue",
};
