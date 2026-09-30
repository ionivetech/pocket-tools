import type { ToolMetadata } from "../../types/tool";

export const toolMetadata: ToolMetadata = {
	slug: "qr-generator",
	name: "QR generator",
	description: "Make a QR code for a link or text, offline.",
	category: "Media",
	icon: "code",
	accent: "blue-strong",
	keywords: ["qr", "code", "share"],
	componentPath: "~/tools/qr-generator/ToolComponent.vue",
};
