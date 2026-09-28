import type { ToolMetadata } from "../../types/tool";

export const toolMetadata: ToolMetadata = {
	slug: "password-generator",
	name: "Password generator",
	description: "Create a strong password without leaving your browser.",
	category: "Everyday",
	icon: "lock",
	accent: "blue-strong",
	keywords: ["password", "security", "random", "everyday"],
	componentPath: "~/components/ToolPlaceholder.vue",
};
