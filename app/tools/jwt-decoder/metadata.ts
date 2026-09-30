import type { ToolMetadata } from "../../types/tool";

export const toolMetadata: ToolMetadata = {
	slug: "jwt-decoder",
	name: "JWT decoder",
	description: "Read what is inside a login token, safely in your browser.",
	category: "Developer",
	icon: "shield",
	accent: "blue",
	keywords: ["jwt", "token", "decode"],
	componentPath: "~/tools/jwt-decoder/ToolComponent.vue",
};
